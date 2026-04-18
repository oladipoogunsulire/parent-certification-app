import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// isModuleComplete
//
// A module is complete when:
//   1. All active lessons have completed:true in UserLessonProgress for this user
//   2. All active scenarios have at least one UserScenarioAttempt for this user
//
// Returns false immediately if the module has no active lessons.
// Vacuously true on condition 2 when the module has no active scenarios.
// ---------------------------------------------------------------------------

export async function isModuleComplete(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const [lessons, scenarios] = await Promise.all([
    prisma.lesson.findMany({
      where: { moduleId, isActive: true },
      select: { id: true },
    }),
    prisma.scenario.findMany({
      where: { moduleId, isActive: true },
      select: { id: true },
    }),
  ])

  // Must have at least one lesson
  if (lessons.length === 0) return false

  const lessonIds   = lessons.map((l) => l.id)
  const scenarioIds = scenarios.map((s) => s.id)

  const [completedCount, attemptedScenarios] = await Promise.all([
    prisma.userLessonProgress.count({
      where: { userId, completed: true, lessonId: { in: lessonIds } },
    }),
    scenarioIds.length > 0
      ? prisma.userScenarioAttempt.findMany({
          where: { userId, scenarioId: { in: scenarioIds } },
          distinct: ["scenarioId"],
          select: { scenarioId: true },
        })
      : Promise.resolve([] as { scenarioId: string }[]),
  ])

  if (completedCount < lessons.length) return false
  if (attemptedScenarios.length < scenarios.length) return false
  return true
}

// ---------------------------------------------------------------------------
// getCompletedModuleCount
//
// Counts modules fully completed by the user across all active tracks.
// Uses a single batch-fetch strategy (3 queries) for efficiency.
// ---------------------------------------------------------------------------

export async function getCompletedModuleCount(userId: string): Promise<number> {
  // Fetch all active modules in active tracks, including their lessons/scenarios
  const modules = await prisma.module.findMany({
    where: { isActive: true, track: { isActive: true } },
    select: {
      id: true,
      lessons:   { where: { isActive: true }, select: { id: true } },
      scenarios: { where: { isActive: true }, select: { id: true } },
    },
  })

  if (modules.length === 0) return 0

  // Collect every lesson and scenario ID across all modules
  const allLessonIds   = modules.flatMap((m) => m.lessons.map((l) => l.id))
  const allScenarioIds = modules.flatMap((m) => m.scenarios.map((s) => s.id))

  // Batch-fetch completed lessons and attempted scenarios
  const [completedLessons, attemptedScenarios] = await Promise.all([
    allLessonIds.length > 0
      ? prisma.userLessonProgress.findMany({
          where: { userId, completed: true, lessonId: { in: allLessonIds } },
          select: { lessonId: true },
        })
      : Promise.resolve([] as { lessonId: string }[]),
    allScenarioIds.length > 0
      ? prisma.userScenarioAttempt.findMany({
          where: { userId, scenarioId: { in: allScenarioIds } },
          distinct: ["scenarioId"],
          select: { scenarioId: true },
        })
      : Promise.resolve([] as { scenarioId: string }[]),
  ])

  const completedLessonSet  = new Set(completedLessons.map((l) => l.lessonId))
  const attemptedScenarioSet = new Set(attemptedScenarios.map((s) => s.scenarioId))

  let count = 0
  for (const mod of modules) {
    if (mod.lessons.length === 0) continue
    if (!mod.lessons.every((l) => completedLessonSet.has(l.id))) continue
    if (!mod.scenarios.every((s) => attemptedScenarioSet.has(s.id))) continue
    count++
  }
  return count
}

// ---------------------------------------------------------------------------
// getBeltForModuleCount
//
// Pure function — no database calls.
// Returns the belt name corresponding to a given number of completed modules.
// Black Belt requires passing the final exam — handled separately.
// ---------------------------------------------------------------------------

export function getBeltForModuleCount(count: number): string | null {
  if (count === 0) return null
  if (count <= 2)  return "White Belt"
  if (count <= 5)  return "Yellow Belt"
  if (count <= 7)  return "Green Belt"
  if (count <= 9)  return "Blue Belt"
  return null // 10 modules → Black Belt requires final exam
}

// ---------------------------------------------------------------------------
// checkAndAwardBelt
//
// Calculates the belt the user has earned from their completed module count,
// compares it to what they currently hold, and updates the User record if
// the belt has changed. Returns whether a change occurred.
// ---------------------------------------------------------------------------

export async function checkAndAwardBelt(userId: string): Promise<{
  newBelt: string | null
  previousBelt: string | null
  beltChanged: boolean
  allModulesComplete: boolean
}> {
  const count           = await getCompletedModuleCount(userId)
  const allModulesComplete = count >= 10

  // earnedBelt is the highest belt earned via modules alone.
  // null is returned for count 0 (no belt yet) and count >= 10 (Black Belt
  // requires the final exam — handled separately in exam-engine.ts).
  const earnedBelt = getBeltForModuleCount(count)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentBelt: true },
  })
  const previousBelt = user?.currentBelt ?? null

  // Only upgrade — never downgrade.
  // Black Belt ("Black Belt" string) is set by completeExamAttempt; never here.
  if (earnedBelt !== null && earnedBelt !== previousBelt) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentBelt:  earnedBelt,
        beltEarnedAt: new Date(),
      },
    })
    return { newBelt: earnedBelt, previousBelt, beltChanged: true, allModulesComplete }
  }

  return { newBelt: previousBelt, previousBelt, beltChanged: false, allModulesComplete }
}
