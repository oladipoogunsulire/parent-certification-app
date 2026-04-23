import AnalyticsDashboard, { type AnalyticsData } from "./AnalyticsDashboard"
import {
  getUserGrowth,
  getSubscriptionMetrics,
  getModuleCompletionRates,
  getScenarioPerformance,
  getInfluenceScoreDistribution,
  getBeltDistribution,
  getExamMetrics,
  getResourceDownloadStats,
  getRecentActivity,
} from "@/lib/analytics"

export const metadata = {
  title: "Analytics — Admin Console",
}

export default async function AdminAnalyticsPage() {
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
