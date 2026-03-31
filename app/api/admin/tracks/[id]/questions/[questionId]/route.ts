import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
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

  const { questionId } = await params
  const { beltId, questionText, questionType, difficultyLevel, options } = await req.json()

  if (!beltId || !questionText) {
    return NextResponse.json(
      { error: "Belt and question text are required." },
      { status: 400 }
    )
  }

  try {
    const question = await prisma.question.update({
      where: { id: questionId },
      data: { beltId, questionText, questionType, difficultyLevel },
    })

    await prisma.questionOption.deleteMany({ where: { questionId } })

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
          questionId,
          optionText: o.optionText,
          isCorrect: o.isCorrect ?? false,
          explanationText: o.explanationText ?? null,
        })),
      })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ error: "Failed to update question." }, { status: 500 })
  }
}
