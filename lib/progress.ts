import { prisma } from "@/lib/prisma"

export interface ModuleProgress {
  /** Total active lessons in this module */
  total: number
  /** How many the user has marked complete */
  completed: number
  /** 0–100 integer */
  percentage: number
  /** lessonId of the most recently visited lesson, or null if never visited */
  lastVisitedLessonId: string | null
  /** true when every lesson is completed */
  isCompleted: boolean
  /** true when at least one lesson has been visited */
  isStarted: boolean
}

/**
 * Returns progress for a single module for the given user.
 * Safe to call with an anonymous userId — returns zero-state.
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgress> {
  const [lessons, progressRecords] = await Promise.all([
    prisma.lesson.findMany({
      where: { moduleId, isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId, lesson: { moduleId } },
      orderBy: { lastVisitedAt: "desc" },
    }),
  ])

  const total = lessons.length
  const completedIds = new Set(
    progressRecords.filter((p) => p.completed).map((p) => p.lessonId)
  )
  const completed = completedIds.size
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const lastVisitedLessonId = progressRecords[0]?.lessonId ?? null
  const isCompleted = total > 0 && completed === total
  const isStarted = progressRecords.length > 0

  return { total, completed, percentage, lastVisitedLessonId, isCompleted, isStarted }
}

/**
 * Returns a map of moduleId → ModuleProgress for all modules in a track.
 * More efficient than calling getModuleProgress per module.
 */
export async function getTrackProgressMap(
  userId: string,
  trackId: string
): Promise<Map<string, ModuleProgress>> {
  // Fetch all lessons with their moduleId for this track
  const [lessons, progressRecords] = await Promise.all([
    prisma.lesson.findMany({
      where: { module: { trackId }, isActive: true },
      select: { id: true, moduleId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userLessonProgress.findMany({
      where: {
        userId,
        lesson: { module: { trackId } },
      },
      select: {
        lessonId: true,
        completed: true,
        lastVisitedAt: true,
        lesson: { select: { moduleId: true } },
      },
      orderBy: { lastVisitedAt: "desc" },
    }),
  ])

  // Group lessons by moduleId
  const lessonsByModule = new Map<string, string[]>()
  for (const l of lessons) {
    if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, [])
    lessonsByModule.get(l.moduleId)!.push(l.id)
  }

  // Group progress by moduleId (ordered by lastVisitedAt desc already)
  const progressByModule = new Map<
    string,
    { completedIds: Set<string>; lastVisitedLessonId: string | null; visited: boolean }
  >()
  for (const p of progressRecords) {
    const moduleId = p.lesson.moduleId
    if (!progressByModule.has(moduleId)) {
      progressByModule.set(moduleId, {
        completedIds: new Set(),
        lastVisitedLessonId: p.lessonId, // first record = most recent (sorted desc)
        visited: true,
      })
    }
    if (p.completed) {
      progressByModule.get(moduleId)!.completedIds.add(p.lessonId)
    }
  }

  // Build result map
  const result = new Map<string, ModuleProgress>()
  for (const [moduleId, lessonIds] of lessonsByModule) {
    const prog = progressByModule.get(moduleId)
    const total = lessonIds.length
    const completed = prog ? prog.completedIds.size : 0
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    result.set(moduleId, {
      total,
      completed,
      percentage,
      lastVisitedLessonId: prog?.lastVisitedLessonId ?? null,
      isCompleted: total > 0 && completed === total,
      isStarted: prog?.visited ?? false,
    })
  }

  return result
}

/**
 * Returns the most recently active module for a user (for "Continue Learning" on the dashboard).
 * Only returns a result when the lesson, module, and track are all active.
 * The lastLessonId is guaranteed to be an active lesson within that module.
 */
export async function getRecentActivity(userId: string): Promise<{
  trackId: string
  trackName: string
  moduleId: string
  moduleTitle: string
  lastLessonId: string
  completed: number
  total: number
  percentage: number
  isCompleted: boolean
} | null> {
  // Require the lesson, its module, and the module's track to all be active.
  // This prevents the card from surfacing content that has been deactivated.
  const recent = await prisma.userLessonProgress.findFirst({
    where: {
      userId,
      lesson: {
        isActive: true,
        module: {
          isActive: true,
          track: { isActive: true },
        },
      },
    },
    orderBy: { lastVisitedAt: "desc" },
    select: {
      lessonId: true,
      lesson: {
        select: {
          moduleId: true,
          module: {
            select: {
              id: true,
              moduleTitle: true,
              trackId: true,
              track: { select: { trackName: true } },
              // Only count active lessons so total reflects what the user can still access
              lessons: {
                where: { isActive: true },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })

  if (!recent) return null

  const mod = recent.lesson.module
  const total = mod.lessons.length

  // Count completions only against active lessons so the percentage is accurate
  const completedCount = await prisma.userLessonProgress.count({
    where: {
      userId,
      completed: true,
      lesson: { moduleId: mod.id, isActive: true },
    },
  })

  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return {
    trackId: mod.trackId,
    trackName: mod.track.trackName,
    moduleId: mod.id,
    moduleTitle: mod.moduleTitle,
    lastLessonId: recent.lessonId,
    completed: completedCount,
    total,
    percentage,
    isCompleted: total > 0 && completedCount === total,
  }
}
