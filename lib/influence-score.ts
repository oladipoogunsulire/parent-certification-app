import { prisma } from "@/lib/prisma"
import type { UserInfluenceProfile, UserScenarioAttempt } from "@prisma/client"

// Re-export types so callers can import them from a single place
export type { UserInfluenceProfile, UserScenarioAttempt }

// ---------------------------------------------------------------------------
// Influence Level classification
// Score range: 30 (all weak) → 100 (all best)
// ---------------------------------------------------------------------------

export function getInfluenceLevel(score: number): string {
  if (score >= 86) return "Ultimate Influencer™"
  if (score >= 66) return "Intentional Parent"
  if (score >= 41) return "Developing Parent"
  return "Reactive Parent"
}

// ---------------------------------------------------------------------------
// recordScenarioAttempt
//
// Records a user's response to a scenario, then upserts their
// UserInfluenceProfile with a recalculated running average score.
//
// Formula: influenceScore = totalScorePoints / totalAttempts
// scoreImpact values are stored on a 0–100 scale; running average
// gives a direct 0–100 influence score — no multiplier needed.
//
// Note: the Neon HTTP adapter does not support interactive $transaction
// callbacks, so each operation is issued as an individual Prisma call.
// ---------------------------------------------------------------------------

export async function recordScenarioAttempt(
  userId: string,
  scenarioId: string,
  selectedResponseId: string
): Promise<UserInfluenceProfile> {
  // Step 1 — Validate response belongs to scenario
  const response = await prisma.scenarioResponse.findFirst({
    where: { id: selectedResponseId, scenarioId },
  })
  if (!response) throw new Error("Invalid response for this scenario")

  // Step 2 — Count prior attempts for attempt number
  const priorAttempts = await prisma.userScenarioAttempt.count({
    where: { userId, scenarioId },
  })

  // Step 3 — Create the attempt record
  await prisma.userScenarioAttempt.create({
    data: {
      id: generateCuid(),
      userId,
      scenarioId,
      selectedResponseId,
      scoreEarned: response.scoreImpact,
      attemptNumber: priorAttempts + 1,
    },
  })

  // Step 4 — Fetch existing profile
  const existingProfile = await prisma.userInfluenceProfile.findUnique({
    where: { userId },
  })

  // Step 5 — Calculate new totals
  // scoreImpact values are stored on a 0–100 scale
  // running average gives a direct 0–100 influence score
  const totalAttempts    = (existingProfile?.totalAttempts    ?? 0) + 1
  const totalScorePoints = (existingProfile?.totalScorePoints ?? 0) + response.scoreImpact
  const influenceScore   = totalScorePoints / totalAttempts
  const influenceLevel   = getInfluenceLevel(influenceScore)

  // Step 6 — Upsert the influence profile
  const profile = await prisma.userInfluenceProfile.upsert({
    where: { userId },
    create: {
      id: generateCuid(),
      userId,
      influenceScore,
      totalAttempts,
      totalScorePoints,
      influenceLevel,
      lastCalculatedAt: new Date(),
    },
    update: {
      influenceScore,
      totalAttempts,
      totalScorePoints,
      influenceLevel,
      lastCalculatedAt: new Date(),
    },
  })

  return profile
}

// ---------------------------------------------------------------------------
// getUserInfluenceProfile
//
// Returns the user's current profile, or null if they haven't attempted
// any scenarios yet.
// ---------------------------------------------------------------------------

export async function getUserInfluenceProfile(
  userId: string
): Promise<UserInfluenceProfile | null> {
  return prisma.userInfluenceProfile.findUnique({
    where: { userId },
  })
}

// ---------------------------------------------------------------------------
// getScenarioAttempts
//
// Returns all attempts a user has made on a specific scenario, ordered
// by attemptNumber ascending. Used for attempt history and retake logic.
// ---------------------------------------------------------------------------

export async function getScenarioAttempts(
  userId: string,
  scenarioId: string
): Promise<UserScenarioAttempt[]> {
  return prisma.userScenarioAttempt.findMany({
    where: { userId, scenarioId },
    orderBy: { attemptNumber: "asc" },
  })
}

// ---------------------------------------------------------------------------
// Internal helper — lightweight cuid-compatible ID generator.
// Uses the same alphabet/length as the @paralleldrive/cuid2 package that
// Prisma uses internally, so IDs are globally unique without a dependency.
// ---------------------------------------------------------------------------

function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10) +
                 Math.random().toString(36).slice(2, 10)
  return `c${timestamp}${random}`.slice(0, 24)
}
