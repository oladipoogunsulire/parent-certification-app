import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserGrowthPoint {
  date: string   // ISO date string, truncated to day
  count: number  // new signups on that day
  cumulative: number
}

export interface SubscriptionMetrics {
  total: number
  active: number
  cancelled: number
  expired: number
  pastDue: number
  conversionRate: number // active / total users * 100
}

export interface ModuleCompletionRate {
  moduleId: string
  moduleTitle: string
  orderIndex: number
  completions: number
  uniqueUsers: number
  completionRate: number // uniqueUsers / totalUsers * 100
}

export interface ScenarioPerformanceStat {
  scenarioId: string
  scenarioTitle: string | null
  totalAttempts: number
  uniqueUsers: number
  averageScore: number
  optimalRate: number // % of attempts where optimal response was chosen
}

export interface InfluenceBucket {
  label: string  // e.g. "0–20"
  min: number
  max: number
  count: number
}

export interface BeltDistributionItem {
  belt: string
  count: number
}

export interface ExamMetrics {
  totalAttempts: number
  completedAttempts: number
  passedAttempts: number
  passRate: number
  averageScore: number
  certificatesIssued: number
  uniqueTestTakers: number
}

export interface ResourceDownloadStat {
  resourceId: string
  fileName: string
  lessonTitle: string
  moduleTitle: string
  downloadCount: number
}

export interface RecentActivityItem {
  type: "signup" | "lesson" | "exam_pass" | "certificate" | "scenario"
  description: string
  occurredAt: string
}

// ---------------------------------------------------------------------------
// 1. User Growth (last N days, one row per day)
// ---------------------------------------------------------------------------

export async function getUserGrowth(days = 30): Promise<UserGrowthPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  // Count by day
  const byDay = new Map<string, number>()
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }

  // Build contiguous daily series
  const result: UserGrowthPoint[] = []
  let cumulative = 0
  for (let i = days; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const count = byDay.get(key) ?? 0
    cumulative += count
    result.push({ date: key, count, cumulative })
  }
  return result
}

// ---------------------------------------------------------------------------
// 2. Subscription Metrics
// ---------------------------------------------------------------------------

export async function getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
  const [totalUsers, subs] = await Promise.all([
    prisma.user.count(),
    prisma.userSubscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  const counts: Record<string, number> = {}
  let total = 0
  for (const row of subs) {
    counts[row.status] = row._count._all
    total += row._count._all
  }

  const active = counts["ACTIVE"] ?? 0

  return {
    total,
    active,
    cancelled: counts["CANCELLED"] ?? 0,
    expired:   counts["EXPIRED"] ?? 0,
    pastDue:   counts["PAST_DUE"] ?? 0,
    conversionRate: totalUsers > 0 ? parseFloat(((active / totalUsers) * 100).toFixed(1)) : 0,
  }
}

// ---------------------------------------------------------------------------
// 3. Module Completion Rates
// ---------------------------------------------------------------------------

export async function getModuleCompletionRates(): Promise<ModuleCompletionRate[]> {
  const [totalUsers, modules, completions] = await Promise.all([
    prisma.user.count(),
    prisma.module.findMany({
      where: { isActive: true },
      select: { id: true, moduleTitle: true, orderIndex: true },
      orderBy: { orderIndex: "asc" },
    }),
    // Use groupBy to count completions per module (via lessons)
    prisma.userLessonProgress.groupBy({
      by: ["lessonId"],
      where: { completed: true },
      _count: { userId: true },
    }),
  ])

  // Map lessonId → completion count
  const lessonCompletions = new Map<string, number>()
  for (const row of completions) {
    lessonCompletions.set(row.lessonId, row._count.userId)
  }

  // For each module, get its lessons and sum completions
  const moduleLessons = await prisma.lesson.findMany({
    where: { isActive: true },
    select: { id: true, moduleId: true },
  })
  const lessonsByModule = new Map<string, string[]>()
  for (const l of moduleLessons) {
    const arr = lessonsByModule.get(l.moduleId) ?? []
    arr.push(l.id)
    lessonsByModule.set(l.moduleId, arr)
  }

  // Count distinct users who completed ALL lessons in a module via CERecord
  const ceRecords = await prisma.cERecord.groupBy({
    by: ["moduleId", "userId"],
    _count: { _all: true },
  })
  const moduleUserSet = new Map<string, Set<string>>()
  for (const row of ceRecords) {
    const set = moduleUserSet.get(row.moduleId) ?? new Set()
    set.add(row.userId)
    moduleUserSet.set(row.moduleId, set)
  }

  return modules.map((mod) => {
    const uniqueUsers = moduleUserSet.get(mod.id)?.size ?? 0
    // total completions = sum of lesson completions across all lessons in module
    const lessonIds = lessonsByModule.get(mod.id) ?? []
    const totalCompletions = lessonIds.reduce((sum, lid) => sum + (lessonCompletions.get(lid) ?? 0), 0)

    return {
      moduleId:       mod.id,
      moduleTitle:    mod.moduleTitle,
      orderIndex:     mod.orderIndex,
      completions:    totalCompletions,
      uniqueUsers,
      completionRate: totalUsers > 0 ? parseFloat(((uniqueUsers / totalUsers) * 100).toFixed(1)) : 0,
    }
  })
}

// ---------------------------------------------------------------------------
// 4. Scenario Performance
// ---------------------------------------------------------------------------

export async function getScenarioPerformance(): Promise<ScenarioPerformanceStat[]> {
  const [scenarios, attemptStats, userCounts] = await Promise.all([
    prisma.scenario.findMany({
      select: { id: true, scenarioTitle: true },
    }),
    prisma.userScenarioAttempt.groupBy({
      by: ["scenarioId"],
      _count: { _all: true },
      _avg:   { scoreEarned: true },
    }),
    // Count distinct users per scenario via groupBy on both scenarioId + userId
    prisma.userScenarioAttempt.groupBy({
      by: ["scenarioId", "userId"],
      _count: { _all: true },
    }),
  ])

  // Map scenarioId → { totalAttempts, avgScore }
  const statsMap = new Map<string, { total: number; avg: number }>()
  for (const row of attemptStats) {
    statsMap.set(row.scenarioId, {
      total: row._count._all,
      avg:   row._avg.scoreEarned ?? 0,
    })
  }

  // Map scenarioId → unique user count
  const uniqueUserMap = new Map<string, Set<string>>()
  for (const row of userCounts) {
    const set = uniqueUserMap.get(row.scenarioId) ?? new Set()
    set.add(row.userId)
    uniqueUserMap.set(row.scenarioId, set)
  }

  // Optimal response rate: attempts where selected response isOptimal = true
  const optimalAttempts = await prisma.userScenarioAttempt.groupBy({
    by: ["scenarioId"],
    where: {
      selectedResponse: { isOptimal: true },
    },
    _count: { _all: true },
  })
  const optimalMap = new Map<string, number>()
  for (const row of optimalAttempts) {
    optimalMap.set(row.scenarioId, row._count._all)
  }

  return scenarios.map((sc) => {
    const stats       = statsMap.get(sc.id)
    const totalAttempts = stats?.total ?? 0
    const uniqueUsers   = uniqueUserMap.get(sc.id)?.size ?? 0
    const optimal       = optimalMap.get(sc.id) ?? 0

    return {
      scenarioId:    sc.id,
      scenarioTitle: sc.scenarioTitle,
      totalAttempts,
      uniqueUsers,
      averageScore:  parseFloat((stats?.avg ?? 0).toFixed(1)),
      optimalRate:   totalAttempts > 0 ? parseFloat(((optimal / totalAttempts) * 100).toFixed(1)) : 0,
    }
  })
}

// ---------------------------------------------------------------------------
// 5. Influence Score Distribution (bucketed histogram)
// ---------------------------------------------------------------------------

export async function getInfluenceScoreDistribution(): Promise<InfluenceBucket[]> {
  const profiles = await prisma.userInfluenceProfile.findMany({
    select: { influenceScore: true },
  })

  const buckets: InfluenceBucket[] = [
    { label: "0–20",   min: 0,  max: 20,  count: 0 },
    { label: "21–40",  min: 21, max: 40,  count: 0 },
    { label: "41–60",  min: 41, max: 60,  count: 0 },
    { label: "61–80",  min: 61, max: 80,  count: 0 },
    { label: "81–100", min: 81, max: 100, count: 0 },
  ]

  for (const p of profiles) {
    const score = p.influenceScore
    for (const bucket of buckets) {
      if (score >= bucket.min && score <= bucket.max) {
        bucket.count++
        break
      }
    }
  }

  return buckets
}

// ---------------------------------------------------------------------------
// 6. Belt Distribution
// ---------------------------------------------------------------------------

export async function getBeltDistribution(): Promise<BeltDistributionItem[]> {
  const rows = await prisma.user.groupBy({
    by: ["currentBelt"],
    _count: { _all: true },
  })

  const result: BeltDistributionItem[] = rows.map((r) => ({
    belt:  r.currentBelt ?? "No Belt",
    count: r._count._all,
  }))

  // Sort by known belt order
  const order = ["White Belt", "Yellow Belt", "Green Belt", "Blue Belt", "Black Belt", "No Belt"]
  result.sort((a, b) => {
    const ai = order.indexOf(a.belt)
    const bi = order.indexOf(b.belt)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return result
}

// ---------------------------------------------------------------------------
// 7. Exam Metrics
// ---------------------------------------------------------------------------

export async function getExamMetrics(): Promise<ExamMetrics> {
  const [totalAttempts, completedAttempts, passedAttempts, avgScore, certs, uniqueTakers] =
    await Promise.all([
      prisma.examAttempt.count(),
      prisma.examAttempt.count({ where: { completedAt: { not: null } } }),
      prisma.examAttempt.count({ where: { passed: true } }),
      prisma.examAttempt.aggregate({
        where: { completedAt: { not: null }, score: { not: null } },
        _avg: { score: true },
      }),
      prisma.examCertificate.count(),
      prisma.examAttempt.groupBy({
        by: ["userId"],
        _count: { _all: true },
      }),
    ])

  return {
    totalAttempts,
    completedAttempts,
    passedAttempts,
    passRate:          completedAttempts > 0 ? parseFloat(((passedAttempts / completedAttempts) * 100).toFixed(1)) : 0,
    averageScore:      parseFloat((avgScore._avg.score ?? 0).toFixed(1)),
    certificatesIssued: certs,
    uniqueTestTakers:  uniqueTakers.length,
  }
}

// ---------------------------------------------------------------------------
// 8. Resource Download Stats (top downloaded resources)
// ---------------------------------------------------------------------------

export async function getResourceDownloadStats(limit = 20): Promise<ResourceDownloadStat[]> {
  const resources = await prisma.lessonResource.findMany({
    orderBy: { downloadCount: "desc" },
    take: limit,
    select: {
      id:            true,
      fileName:      true,
      downloadCount: true,
      lesson: {
        select: {
          lessonTitle: true,
          module: {
            select: { moduleTitle: true },
          },
        },
      },
    },
  })

  return resources.map((r) => ({
    resourceId:    r.id,
    fileName:      r.fileName,
    lessonTitle:   r.lesson.lessonTitle,
    moduleTitle:   r.lesson.module.moduleTitle,
    downloadCount: r.downloadCount,
  }))
}

// ---------------------------------------------------------------------------
// 9. Recent Activity Feed (last N events)
// ---------------------------------------------------------------------------

export async function getRecentActivity(limit = 20): Promise<RecentActivityItem[]> {
  const [signups, lessons, certificates, scenarios] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { email: true, firstName: true, lastName: true, name: true, createdAt: true },
    }),
    prisma.userLessonProgress.findMany({
      where: { completed: true },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        completedAt: true,
        user:   { select: { email: true, firstName: true, lastName: true, name: true } },
        lesson: { select: { lessonTitle: true } },
      },
    }),
    prisma.examCertificate.findMany({
      orderBy: { issuedAt: "desc" },
      take: limit,
      select: {
        issuedAt: true,
        user: { select: { email: true, firstName: true, lastName: true, name: true } },
        score: true,
      },
    }),
    prisma.userScenarioAttempt.findMany({
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        completedAt: true,
        user:     { select: { email: true, firstName: true, lastName: true, name: true } },
        scenario: { select: { scenarioTitle: true } },
        scoreEarned: true,
      },
    }),
  ])

  function displayName(u: { email: string; firstName?: string | null; lastName?: string | null; name?: string | null }): string {
    const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
    if (full) return full
    if (u.name) return u.name
    return u.email.split("@")[0]
  }

  const events: RecentActivityItem[] = []

  for (const u of signups) {
    events.push({
      type:        "signup",
      description: `${displayName(u)} joined`,
      occurredAt:  u.createdAt.toISOString(),
    })
  }

  for (const l of lessons) {
    if (!l.completedAt) continue
    events.push({
      type:        "lesson",
      description: `${displayName(l.user)} completed "${l.lesson.lessonTitle}"`,
      occurredAt:  l.completedAt.toISOString(),
    })
  }

  for (const c of certificates) {
    events.push({
      type:        "certificate",
      description: `${displayName(c.user)} earned Black Belt certificate (${Math.round(c.score)}%)`,
      occurredAt:  c.issuedAt.toISOString(),
    })
  }

  for (const s of scenarios) {
    events.push({
      type:        "scenario",
      description: `${displayName(s.user)} attempted "${s.scenario.scenarioTitle}" (${Math.round(s.scoreEarned)}pts)`,
      occurredAt:  s.completedAt.toISOString(),
    })
  }

  // Sort descending by date, take top N
  events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  return events.slice(0, limit)
}
