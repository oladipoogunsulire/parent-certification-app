import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: trackId } = await params
  const { beltId, questionText, questionType, difficultyLevel, options } = await req.json()

  if (!beltId || !questionText) {
    return NextResponse.json(
      { error: "Belt and question text are required." },
      { status: 400 }
    )
  }

  try {
    const question = await prisma.question.create({
      data: {
        trackId,
        beltId,
        questionText,
        questionType: questionType ?? "MULTIPLE_CHOICE",
        difficultyLevel: difficultyLevel ?? 1,
      },
    })

    const validOptions = (options ?? []).filter(
      (o: { optionText?: string }) => o.optionText?.trim()
    )

    if (validOptions.length > 0) {
      await prisma.questionOption.createMany({
        data: validOptions.map((o: {
          optionText: string
          isCorrect?: boolean
          explanationText?: string
        }) => ({
          questionId: question.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect ?? false,
          explanationText: o.explanationText ?? null,
        })),
      })
    }

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error("Create question error:", error)
    return NextResponse.json({ error: "Failed to save question." }, { status: 500 })
  }
}
