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
// Formula: influenceScore = (totalScorePoints / totalAttempts) * 10
// This converts the 3–10 response scale to a 30–100 percentage range.
//
// All writes are wrapped in a single transaction.
// ---------------------------------------------------------------------------

export async function recordScenarioAttempt(
  userId: string,
  scenarioId: string,
  selectedResponseId: string
): Promise<UserInfluenceProfile> {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch the selected response to get its scoreImpact
    const selectedResponse = await tx.scenarioResponse.findUniqueOrThrow({
      where: { id: selectedResponseId },
      select: { id: true, scenarioId: true, scoreImpact: true },
    })

    // Guard: the response must belong to the requested scenario
    if (selectedResponse.scenarioId !== scenarioId) {
      throw new Error("selectedResponseId does not belong to the given scenarioId")
    }

    // 2. Count existing attempts to determine the next attemptNumber
    const existingAttemptCount = await tx.userScenarioAttempt.count({
      where: { userId, scenarioId },
    })

    // 3. Create the new attempt record
    await tx.userScenarioAttempt.create({
      data: {
        id: generateCuid(),
        userId,
        scenarioId,
        selectedResponseId,
        scoreEarned: selectedResponse.scoreImpact,
        attemptNumber: existingAttemptCount + 1,
      },
    })

    // 4. Read the existing profile so we can compute precise new totals
    const existing = await tx.userInfluenceProfile.findUnique({
      where: { userId },
    })

    const newTotalAttempts    = (existing?.totalAttempts    ?? 0) + 1
    const newTotalScorePoints = (existing?.totalScorePoints ?? 0) + selectedResponse.scoreImpact
    const newInfluenceScore   = (newTotalScorePoints / newTotalAttempts) * 10
    const newInfluenceLevel   = getInfluenceLevel(newInfluenceScore)
    const now                 = new Date()

    // 5. Upsert the profile with recalculated values
    return tx.userInfluenceProfile.upsert({
      where: { userId },
      update: {
        totalAttempts:    newTotalAttempts,
        totalScorePoints: newTotalScorePoints,
        influenceScore:   newInfluenceScore,
        influenceLevel:   newInfluenceLevel,
        lastCalculatedAt: now,
        updatedAt:        now,
      },
      create: {
        id:               generateCuid(),
        userId,
        totalAttempts:    1,
        totalScorePoints: selectedResponse.scoreImpact,
        influenceScore:   selectedResponse.scoreImpact * 10,
        influenceLevel:   getInfluenceLevel(selectedResponse.scoreImpact * 10),
        lastCalculatedAt: now,
        updatedAt:        now,
      },
    })
  })
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
