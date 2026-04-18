import { prisma } from "@/lib/prisma"
import { BLACK_BELT_EXAM_ENABLED } from "@/lib/feature-flags"
import { Prisma } from "@prisma/client"
import type { ExamAttempt, ExamCertificate, ExamConfiguration } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExamQuestionWithOptions = Prisma.ExamQuestionGetPayload<{
  include: { options: true }
}>

export type ExamResult = {
  attempt: ExamAttempt
  score: number           // percentage e.g. 87.5
  passed: boolean
  correctCount: number
  totalCount: number
  timeTakenSeconds: number | null
  passingThreshold: number
  certificate: ExamCertificate | null // only if passed
  beltUpdate: { beltChanged: boolean; newBelt: string | null }
}

// ---------------------------------------------------------------------------
// Error class — carries HTTP status code for route handlers
// ---------------------------------------------------------------------------

export class ExamError extends Error {
  readonly statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = "ExamError"
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Randomly pick up to n items from arr. Returns all if arr.length <= n. */
function pickRandom<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr]
  return shuffleArray(arr).slice(0, n)
}

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  return `c${timestamp}${random}`.slice(0, 24)
}

// ---------------------------------------------------------------------------
// isEligibleForExam
// ---------------------------------------------------------------------------

export async function isEligibleForExam(
  userId: string
): Promise<{ eligible: boolean; reason: string | null }> {
  if (!BLACK_BELT_EXAM_ENABLED) {
    return { eligible: false, reason: "The exam is not currently available" }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentBelt: true },
  })

  if (user?.currentBelt !== "Brown Belt") {
    return {
      eligible: false,
      reason: "You need to earn your Brown Belt first",
    }
  }

  return { eligible: true, reason: null }
}

// ---------------------------------------------------------------------------
// getExamConfiguration
// ---------------------------------------------------------------------------

export async function getExamConfiguration(): Promise<ExamConfiguration> {
  const config = await prisma.examConfiguration.findFirst()
  if (config) return config

  return prisma.examConfiguration.create({
    data: {
      isEnabled: false,
      passingThreshold: 90,
      totalQuestions: 40,
      isTimed: true,
      timeLimitMinutes: 45,
      easyPercent: 40,
      mediumPercent: 40,
      hardPercent: 20,
      randomiseQuestions: true,
      randomiseOptions: true,
      certificateSignatory: "Dr. Tilis",
    },
  })
}

// ---------------------------------------------------------------------------
// selectExamQuestions
// ---------------------------------------------------------------------------

export async function selectExamQuestions(
  config: ExamConfiguration
): Promise<ExamQuestionWithOptions[]> {
  const allActive = await prisma.examQuestion.findMany({
    where: { isActive: true },
    include: { options: { orderBy: { displayOrder: "asc" } } },
  })

  const easyPool   = allActive.filter((q) => q.difficulty === "EASY")
  const mediumPool = allActive.filter((q) => q.difficulty === "MEDIUM")
  const hardPool   = allActive.filter((q) => q.difficulty === "HARD")

  // Calculate required counts — hard gets the remainder to avoid rounding drift
  const easyCount   = Math.round((config.totalQuestions * config.easyPercent)   / 100)
  const mediumCount = Math.round((config.totalQuestions * config.mediumPercent) / 100)
  const hardCount   = config.totalQuestions - easyCount - mediumCount

  const selectedEasy   = pickRandom(easyPool,   easyCount)
  const selectedMedium = pickRandom(mediumPool, mediumCount)
  const selectedHard   = pickRandom(hardPool,   hardCount)

  let selected = [...selectedEasy, ...selectedMedium, ...selectedHard]

  // Graceful degradation: fill any shortfall from the remaining pool
  const shortfall = config.totalQuestions - selected.length
  if (shortfall > 0) {
    const selectedIds = new Set(selected.map((q) => q.id))
    const remaining   = allActive.filter((q) => !selectedIds.has(q.id))
    selected = [...selected, ...pickRandom(remaining, shortfall)]
  }

  // Shuffle question order if configured
  if (config.randomiseQuestions) {
    selected = shuffleArray(selected)
  }

  // Shuffle each question's options if configured
  if (config.randomiseOptions) {
    selected = selected.map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }))
  }

  return selected
}

// ---------------------------------------------------------------------------
// startExamAttempt
// ---------------------------------------------------------------------------

export async function startExamAttempt(userId: string): Promise<{
  attempt: ExamAttempt
  questions: ExamQuestionWithOptions[]
  config: ExamConfiguration
}> {
  const eligibility = await isEligibleForExam(userId)
  if (!eligibility.eligible) {
    throw new ExamError(403, eligibility.reason ?? "Not eligible for exam")
  }

  const config    = await getExamConfiguration()
  const questions = await selectExamQuestions(config)

  const existingCount = await prisma.examAttempt.count({ where: { userId } })

  const attempt = await prisma.examAttempt.create({
    data: {
      id: generateCuid(),
      userId,
      startedAt: new Date(),
      attemptNumber: existingCount + 1,
    },
  })

  return { attempt, questions, config }
}

// ---------------------------------------------------------------------------
// submitExamAnswer
// ---------------------------------------------------------------------------

export async function submitExamAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string,
  userId: string
): Promise<{
  isCorrect: boolean
  correctOptionId: string
  explanation: string | null
  answeredAt: Date
}> {
  // Validate attempt ownership
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
  })
  if (!attempt || attempt.userId !== userId) {
    throw new ExamError(403, "Attempt not found")
  }
  if (attempt.completedAt !== null) {
    throw new ExamError(400, "This exam attempt has already been completed")
  }

  // Validate option belongs to question
  const selectedOption = await prisma.examQuestionOption.findUnique({
    where: { id: selectedOptionId },
  })
  if (!selectedOption || selectedOption.questionId !== questionId) {
    throw new ExamError(400, "Option does not belong to this question")
  }

  // Find the correct option for this question
  const correctOption = await prisma.examQuestionOption.findFirst({
    where: { questionId, isCorrect: true },
  })

  // Record the answer
  await prisma.examAttemptAnswer.create({
    data: {
      id: generateCuid(),
      attemptId,
      questionId,
      selectedOptionId,
      isCorrect: selectedOption.isCorrect,
      answeredAt: new Date(),
    },
  })

  return {
    isCorrect: selectedOption.isCorrect,
    correctOptionId: correctOption?.id ?? selectedOptionId,
    explanation: selectedOption.explanation,
    answeredAt: new Date(),
  }
}

// ---------------------------------------------------------------------------
// completeExamAttempt
// ---------------------------------------------------------------------------

export async function completeExamAttempt(
  attemptId: string,
  userId: string
): Promise<ExamResult> {
  // Validate attempt ownership and status
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
  })
  if (!attempt || attempt.userId !== userId) {
    throw new ExamError(403, "Attempt not found")
  }
  if (attempt.completedAt !== null) {
    throw new ExamError(400, "This exam attempt has already been completed")
  }

  const config = await getExamConfiguration()

  // Fetch all answers for this attempt
  const answers = await prisma.examAttemptAnswer.findMany({
    where: { attemptId },
  })

  const totalCount   = answers.length
  const correctCount = answers.filter((a) => a.isCorrect).length
  const finalScore   = totalCount > 0 ? (correctCount / totalCount) * 100 : 0
  const passed       = finalScore >= config.passingThreshold

  const now             = new Date()
  const timeTakenSeconds = Math.round(
    (now.getTime() - attempt.startedAt.getTime()) / 1000
  )

  // Update the attempt record
  const updatedAttempt = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt:      now,
      score:            finalScore,
      passed,
      timeTakenSeconds,
    },
  })

  let certificate: ExamCertificate | null = null
  let beltUpdate: { beltChanged: boolean; newBelt: string | null } = {
    beltChanged: false,
    newBelt: null,
  }

  if (passed) {
    // Upsert certificate — keep existing certificateCode if updating
    certificate = await prisma.examCertificate.upsert({
      where: { userId },
      create: {
        userId,
        attemptId:  updatedAttempt.id,
        issuedAt:   now,
        score:      finalScore,
      },
      update: {
        attemptId:  updatedAttempt.id,
        issuedAt:   now,
        score:      finalScore,
      },
    })

    // Award Black Belt
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentBelt:  "Black Belt",
        beltEarnedAt: now,
      },
    })

    beltUpdate = { beltChanged: true, newBelt: "Black Belt" }
  }

  return {
    attempt:          updatedAttempt,
    score:            finalScore,
    passed,
    correctCount,
    totalCount,
    timeTakenSeconds,
    passingThreshold: config.passingThreshold,
    certificate,
    beltUpdate,
  }
}

// ---------------------------------------------------------------------------
// getUserExamHistory
// ---------------------------------------------------------------------------

export async function getUserExamHistory(userId: string) {
  return prisma.examAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    include: {
      _count: { select: { answers: true } },
    },
    orderBy: { completedAt: "desc" },
  })
}

// ---------------------------------------------------------------------------
// getExamProgress
// ---------------------------------------------------------------------------

export async function getExamProgress(
  attemptId: string,
  userId: string
): Promise<{
  answeredCount: number
  totalQuestions: number
  timeRemainingSeconds: number | null
}> {
  const [attempt, config, answeredCount] = await Promise.all([
    prisma.examAttempt.findUnique({ where: { id: attemptId } }),
    getExamConfiguration(),
    prisma.examAttemptAnswer.count({ where: { attemptId } }),
  ])

  if (!attempt || attempt.userId !== userId) {
    throw new ExamError(403, "Attempt not found")
  }

  let timeRemainingSeconds: number | null = null
  if (config.isTimed) {
    const elapsedMs  = Date.now() - attempt.startedAt.getTime()
    const limitMs    = config.timeLimitMinutes * 60 * 1000
    timeRemainingSeconds = Math.max(0, Math.round((limitMs - elapsedMs) / 1000))
  }

  return {
    answeredCount,
    totalQuestions:      config.totalQuestions,
    timeRemainingSeconds,
  }
}
