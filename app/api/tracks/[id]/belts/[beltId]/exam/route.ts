import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

interface SubmittedAnswer {
  questionId: string
  selectedOptionIds: string[]
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; beltId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: trackId, beltId } = await params

  // Verify active subscription
  const sub = await prisma.userSubscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  })
  if (!sub) {
    return NextResponse.json({ error: "Active subscription required." }, { status: 403 })
  }

  const { answers, timeTakenSeconds } = await req.json() as {
    answers: SubmittedAnswer[]
    timeTakenSeconds?: number
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "No answers submitted." }, { status: 400 })
  }

  try {
    // Fetch belt for passing threshold
    const belt = await prisma.belt.findUnique({
      where: { id: beltId },
      include: { track: true },
    })
    if (!belt) {
      return NextResponse.json({ error: "Belt not found." }, { status: 404 })
    }

    // Fetch questions with correct answers server-side
    const questionIds = answers.map((a) => a.questionId)
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds }, beltId, isActive: true },
      include: { options: true },
    })

    // Grade each question
    let correctCount = 0
    const results = questions.map((q) => {
      const submitted = answers.find((a) => a.questionId === q.id)
      const selectedIds = submitted?.selectedOptionIds ?? []
      const correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id)

      let isCorrect = false
      if (q.questionType === "MULTIPLE_CHOICE" || q.questionType === "SCENARIO_INTEGRATED") {
        // Single correct answer — selected option must be correct
        isCorrect =
          selectedIds.length === 1 &&
          correctOptionIds.includes(selectedIds[0])
      } else {
        // MULTI_SELECT — exact match of correct set
        const selectedSet = new Set(selectedIds)
        const correctSet = new Set(correctOptionIds)
        isCorrect =
          selectedSet.size === correctSet.size &&
          [...selectedSet].every((id) => correctSet.has(id))
      }

      if (isCorrect) correctCount++

      return {
        questionId: q.id,
        correct: isCorrect,
        correctOptionIds,
      }
    })

    const totalQuestions = questions.length
    const scorePercentage =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
    const passed = scorePercentage >= belt.passingThreshold

    // Count previous attempts for attempt number
    const prevAttempts = await prisma.examAttempt.count({
      where: { userId: session.user.id, beltId },
    })

    await prisma.examAttempt.create({
      data: {
        userId: session.user.id,
        trackId,
        beltId,
        scorePercentage,
        passed,
        attemptNumber: prevAttempts + 1,
        timeTakenSeconds: timeTakenSeconds ?? null,
      },
    })

    // Issue or update certification if passed
    if (passed) {
      const expiryDate = belt.expirable
        ? new Date(
            Date.now() +
              belt.track.expiryDurationMonths * 30 * 24 * 60 * 60 * 1000
          )
        : null

      await prisma.certification.upsert({
        where: {
          userId_trackId_beltId: {
            userId: session.user.id,
            trackId,
            beltId,
          },
        },
        update: {
          status: "ACTIVE",
          issueDate: new Date(),
          expiryDate,
          verificationToken: crypto.randomUUID(),
          curriculumVersionAtIssue: belt.track.curriculumVersion,
        },
        create: {
          userId: session.user.id,
          trackId,
          beltId,
          status: "ACTIVE",
          issueDate: new Date(),
          expiryDate,
          verificationToken: crypto.randomUUID(),
          curriculumVersionAtIssue: belt.track.curriculumVersion,
        },
      })
    }

    return NextResponse.json({
      passed,
      scorePercentage: Math.round(scorePercentage * 10) / 10,
      correctCount,
      totalQuestions,
      passingThreshold: belt.passingThreshold,
      results,
    })
  } catch (error) {
    console.error("Exam grading error:", error)
    return NextResponse.json({ error: "Failed to grade exam." }, { status: 500 })
  }
}
