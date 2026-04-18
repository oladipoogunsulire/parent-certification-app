import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { submitExamAnswer, ExamError } from "@/lib/exam-engine"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 })
  }

  const body = await req.json() as {
    attemptId?: string
    questionId?: string
    selectedOptionId?: string
  }

  const { attemptId, questionId, selectedOptionId } = body
  if (!attemptId || !questionId || !selectedOptionId) {
    return NextResponse.json(
      { error: "attemptId, questionId and selectedOptionId are required" },
      { status: 400 }
    )
  }

  try {
    const result = await submitExamAnswer(
      attemptId,
      questionId,
      selectedOptionId,
      user.id
    )

    return NextResponse.json({
      isCorrect:       result.isCorrect,
      correctOptionId: result.correctOptionId,
      explanation:     result.explanation,
    })
  } catch (err) {
    if (err instanceof ExamError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error("Exam answer error:", err)
    return NextResponse.json({ error: "Failed to record answer" }, { status: 500 })
  }
}
