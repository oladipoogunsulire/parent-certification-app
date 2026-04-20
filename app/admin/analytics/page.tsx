import AnalyticsDashboard, { type AnalyticsData } from "./AnalyticsDashboard"

export const metadata = {
  title: "Analytics — Admin Console",
}

// Fetch one analytics endpoint, return null on error
async function safeFetch<T>(url: string, base: string): Promise<T | null> {
  try {
    const res = await fetch(`${base}${url}`, {
      cache: "no-store",
      headers: { Cookie: "" }, // Server-to-server; auth middleware handles cookies separately
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export default async function AdminAnalyticsPage() {
  // Next.js server components can use relative fetch with the internal base URL
  // We query the API routes directly via Prisma in lib/analytics.ts to avoid
  // the cookie-forwarding complexity of server-to-server fetches.
  // Instead, import the analytics functions directly.
  const {
    getUserGrowth,
    getSubscriptionMetrics,
    getModuleCompletionRates,
    getScenarioPerformance,
    getInfluenceScoreDistribution,
    getBeltDistribution,
    getExamMetrics,
    getResourceDownloadStats,
    getRecentActivity,
  } = await import("@/lib/analytics")

  const [
    userGrowthData,
    subscriptionData,
    modulesData,
    scenariosData,
    influenceData,
    beltData,
    examData,
    resourcesData,
    activityData,
  ] = await Promise.allSettled([
    getUserGrowth(30),
    getSubscriptionMetrics(),
    getModuleCompletionRates(),
    getScenarioPerformance(),
    getInfluenceScoreDistribution(),
    getBeltDistribution(),
    getExamMetrics(),
    getResourceDownloadStats(10),
    getRecentActivity(20),
  ])

  function settled<T>(result: PromiseSettledResult<T>): T | null {
    return result.status === "fulfilled" ? result.value : null
  }

  const analytics: AnalyticsData = {
    userGrowth:        settled(userGrowthData)        ?? [],
    subscriptions:     settled(subscriptionData)      ?? null,
    modules:           settled(modulesData)           ?? [],
    scenarios:         settled(scenariosData)         ?? [],
    influenceDistrib:  settled(influenceData)         ?? [],
    beltDistrib:       settled(beltData)              ?? [],
    examMetrics:       settled(examData)              ?? null,
    resources:         settled(resourcesData)         ?? [],
    recentActivity:    settled(activityData)          ?? [],
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1E3A5F]">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Platform-wide metrics and learner engagement data.
        </p>
      </div>
      <AnalyticsDashboard data={analytics} />
    </div>
  )
}
