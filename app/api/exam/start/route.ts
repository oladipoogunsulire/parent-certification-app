import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startExamAttempt, ExamError } from "@/lib/exam-engine"

export async function POST() {
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

  try {
    const { attempt, questions, config } = await startExamAttempt(user.id)

    // Strip isCorrect from every option — NEVER expose correct answers before submission
    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      options: q.options.map(({ isCorrect: _isCorrect, ...opt }) => opt),
    }))

    return NextResponse.json({
      attemptId:     attempt.id,
      attemptNumber: attempt.attemptNumber,
      questions:     sanitizedQuestions,
      config: {
        totalQuestions:   config.totalQuestions,
        isTimed:          config.isTimed,
        timeLimitMinutes: config.timeLimitMinutes,
        passingThreshold: config.passingThreshold,
      },
    })
  } catch (err) {
    if (err instanceof ExamError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error("Exam start error:", err)
    return NextResponse.json({ error: "Failed to start exam" }, { status: 500 })
  }
}
