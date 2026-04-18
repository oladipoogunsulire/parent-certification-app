import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function adminGuard() {
  const session = await auth()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { questionId } = await params
  const body = await req.json()
  const { questionText, difficulty, moduleTag, isActive, options } = body

  if (!questionText?.trim()) {
    return NextResponse.json({ error: "Question text is required" }, { status: 400 })
  }

  if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 })
  }

  if (!Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: "At least 2 options required" }, { status: 400 })
  }

  const correctCount = options.filter((o: { isCorrect: boolean }) => o.isCorrect).length
  if (correctCount !== 1) {
    return NextResponse.json({ error: "Exactly one option must be marked correct" }, { status: 400 })
  }

  const existing = await prisma.examQuestion.findUnique({ where: { id: questionId } })
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  // Replace all options
  await prisma.examQuestionOption.deleteMany({ where: { questionId } })

  const question = await prisma.examQuestion.update({
    where: { id: questionId },
    data: {
      questionText: questionText.trim(),
      difficulty,
      moduleTag: moduleTag?.trim() || null,
      isActive: Boolean(isActive),
      options: {
        create: options.map(
          (opt: { optionText: string; isCorrect: boolean; explanation?: string }, idx: number) => ({
            optionText: opt.optionText.trim(),
            isCorrect: Boolean(opt.isCorrect),
            explanation: opt.explanation?.trim() || null,
            displayOrder: idx,
          })
        ),
      },
    },
    include: {
      options: { orderBy: { displayOrder: "asc" } },
    },
  })

  return NextResponse.json(question)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { questionId } = await params

  const existing = await prisma.examQuestion.findUnique({ where: { id: questionId } })
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  // Soft delete
  await prisma.examQuestion.update({
    where: { id: questionId },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
