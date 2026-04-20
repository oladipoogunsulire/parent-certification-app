"use client"

import { useState, useMemo } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type {
  UserGrowthPoint,
  SubscriptionMetrics,
  ModuleCompletionRate,
  ScenarioPerformanceStat,
  InfluenceBucket,
  BeltDistributionItem,
  ExamMetrics,
  ResourceDownloadStat,
  RecentActivityItem,
} from "@/lib/analytics"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsData {
  userGrowth:       UserGrowthPoint[]
  subscriptions:    SubscriptionMetrics | null
  modules:          ModuleCompletionRate[]
  scenarios:        ScenarioPerformanceStat[]
  influenceDistrib: InfluenceBucket[]
  beltDistrib:      BeltDistributionItem[]
  examMetrics:      ExamMetrics | null
  resources:        ResourceDownloadStat[]
  recentActivity:   RecentActivityItem[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIMARY   = "#1E3A5F"
const ACCENT    = "#F97316"

const BELT_COLORS: Record<string, string> = {
  "No Belt":     "#D1D5DB",
  "White Belt":  "#F3F4F6",
  "Yellow Belt": "#FCD34D",
  "Green Belt":  "#22C55E",
  "Blue Belt":   "#3B82F6",
  "Black Belt":  "#1E3A5F",
}

const INFLUENCE_COLORS: Record<string, string> = {
  "0–20":   "#9CA3AF",
  "21–40":  "#9CA3AF",
  "41–60":  "#3B82F6",
  "61–80":  ACCENT,
  "81–100": PRIMARY,
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function activityIcon(type: RecentActivityItem["type"]): string {
  switch (type) {
    case "signup":      return "👤"
    case "lesson":      return "✅"
    case "exam_pass":   return "📜"
    case "certificate": return "🥋"
    case "scenario":    return "🎯"
    default:            return "•"
  }
}

function moduleBarColor(rate: number): string {
  if (rate <= 30) return "#EF4444"
  if (rate <= 60) return "#F59E0B"
  return "#22C55E"
}

function scoreColor(score: number): string {
  if (score < 50) return "text-red-600"
  if (score < 70) return "text-amber-600"
  return "text-green-600"
}

function optimalColor(rate: number): string {
  if (rate < 30) return "text-red-600"
  if (rate < 60) return "text-amber-600"
  return "text-green-600"
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-[#1E3A5F] mb-4">{children}</h3>
  )
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">
      {message}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 1 — Platform Overview Cards
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  subColour = "text-gray-400",
}: {
  label: string
  value: string | number
  sub?: string
  subColour?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 border-l-4 border-l-[#1E3A5F]">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-[#1E3A5F]">{fmt(typeof value === "string" ? parseFloat(value) || 0 : value)}</p>
      {sub && <p className={`text-xs mt-1 ${subColour}`}>{sub}</p>}
    </div>
  )
}

function OverviewSection({ data }: { data: AnalyticsData }) {
  const totalUsersThisMonth = useMemo(() => {
    if (!data.userGrowth.length) return 0
    const cutoff = new Date()
    cutoff.setDate(1)
    cutoff.setHours(0, 0, 0, 0)
    return data.userGrowth
      .filter((p) => new Date(p.date) >= cutoff)
      .reduce((s, p) => s + p.count, 0)
  }, [data.userGrowth])

  const totalUsers       = data.userGrowth.at(-1)?.cumulative ?? 0
  const totalCompleted   = data.modules.reduce((s, m) => s + m.completions, 0)
  const beltsEarned      = data.beltDistrib
    .filter((b) => b.belt !== "No Belt")
    .reduce((s, b) => s + b.count, 0)

  const totalInfluence   = data.influenceDistrib.reduce((s, b) => s + b.count, 0)
  const avgInfluence     = totalInfluence === 0 ? 0 : Math.round(
    data.influenceDistrib.reduce((s, b) => {
      const mid = (b.min + b.max) / 2
      return s + mid * b.count
    }, 0) / totalInfluence
  )

  return (
    <section className="mb-10">
      <SectionTitle>Platform Overview</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Users"
          value={totalUsers}
          sub={totalUsersThisMonth > 0 ? `+${totalUsersThisMonth} this month` : "—"}
          subColour={totalUsersThisMonth > 0 ? "text-green-600" : "text-gray-400"}
        />
        <StatCard
          label="Active Subscribers"
          value={data.subscriptions?.active ?? 0}
          sub={data.subscriptions ? `${data.subscriptions.conversionRate}% conversion` : undefined}
        />
        <StatCard
          label="Modules Completed"
          value={totalCompleted}
          sub="total lesson completions"
        />
        <StatCard
          label="Avg Influence Score"
          value={avgInfluence}
          sub="out of 100"
        />
        <StatCard
          label="Belts Earned"
          value={beltsEarned}
          sub="across all belt levels"
        />
        <StatCard
          label="Certified"
          value={data.examMetrics?.certificatesIssued ?? 0}
          sub="Black Belt holders"
        />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 2 — User Growth Chart
// ---------------------------------------------------------------------------

function UserGrowthSection({ data }: { data: UserGrowthPoint[] }) {
  const hasData = data.some((d) => d.count > 0)

  // Show every 5th date label to avoid crowding
  const tickFormatter = (value: string, index: number) => {
    if (index % 5 !== 0) return ""
    return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  }

  return (
    <section className="mb-10">
      <Panel>
        <SectionTitle>User Growth — Last 30 Days</SectionTitle>
        {!hasData ? (
          <EmptyState message="No signup data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) =>
                  new Date(v as string).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="count"
                name="New Signups"
                stroke={ACCENT}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Users"
                stroke={PRIMARY}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 3 — Learning Progress
// ---------------------------------------------------------------------------

function ModuleCompletionPanel({ modules }: { modules: ModuleCompletionRate[] }) {
  if (!modules.length) return <EmptyState message="No module data yet" />

  const chartData = modules.map((m) => ({
    name: m.moduleTitle.length > 25 ? m.moduleTitle.slice(0, 24) + "…" : m.moduleTitle,
    completionRate: m.completionRate,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, modules.length * 40)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Tooltip
          formatter={(v) => [`${v}%`, "Completion Rate"]}
          contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="completionRate" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={moduleBarColor(entry.completionRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BeltDistPanel({ belts }: { belts: BeltDistributionItem[] }) {
  const nonEmpty = belts.filter((b) => b.count > 0)
  if (!nonEmpty.length) return <EmptyState message="No belt data yet" />

  const total = nonEmpty.reduce((s, b) => s + b.count, 0)

  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={nonEmpty}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="count"
            nameKey="belt"
            paddingAngle={2}
          >
            {nonEmpty.map((entry) => (
              <Cell
                key={entry.belt}
                fill={BELT_COLORS[entry.belt] ?? "#9CA3AF"}
                stroke={entry.belt === "White Belt" ? "#E5E7EB" : "none"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [`${v} users (${Math.round((Number(v) / total) * 100)}%)`, name]}
            contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
        {nonEmpty.map((b) => (
          <div key={b.belt} className="flex items-center gap-2 text-xs text-gray-600">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 border"
              style={{
                background: BELT_COLORS[b.belt] ?? "#9CA3AF",
                borderColor: b.belt === "White Belt" ? "#D1D5DB" : "transparent",
              }}
            />
            <span className="truncate">{b.belt}</span>
            <span className="ml-auto font-medium text-[#1E3A5F]">{b.count}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function LearningSection({ data }: { data: AnalyticsData }) {
  return (
    <section className="mb-10">
      <SectionTitle>Learning Progress</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <p className="text-sm font-semibold text-gray-700 mb-4">Module Completion Rates</p>
          <ModuleCompletionPanel modules={data.modules} />
        </Panel>
        <Panel>
          <p className="text-sm font-semibold text-gray-700 mb-4">Belt Distribution</p>
          <BeltDistPanel belts={data.beltDistrib} />
        </Panel>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 4 — Influence Score™
// ---------------------------------------------------------------------------

const SCENARIO_PAGE_SIZE = 10

function ScenarioTable({ scenarios }: { scenarios: ScenarioPerformanceStat[] }) {
  const [page, setPage]         = useState(0)
  const [sortAsc, setSortAsc]   = useState(true)  // ascending = lowest first

  const sorted = useMemo(
    () => [...scenarios].sort((a, b) => sortAsc
      ? a.averageScore - b.averageScore
      : b.averageScore - a.averageScore
    ),
    [scenarios, sortAsc]
  )

  const pages     = Math.ceil(sorted.length / SCENARIO_PAGE_SIZE)
  const paginated = sorted.slice(page * SCENARIO_PAGE_SIZE, (page + 1) * SCENARIO_PAGE_SIZE)

  if (!scenarios.length) return <EmptyState message="No scenario attempts yet" />

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Scenario</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Attempts</th>
              <th
                className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-[#1E3A5F] select-none"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Avg Score {sortAsc ? "↑" : "↓"}
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Optimal %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((sc) => (
              <tr key={sc.scenarioId} className="hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-800 max-w-[200px] truncate">
                  {sc.scenarioTitle ?? "Untitled"}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">{fmt(sc.totalAttempts)}</td>
                <td className={`py-2 px-3 text-right font-semibold ${scoreColor(sc.averageScore)}`}>
                  {sc.averageScore.toFixed(1)}
                </td>
                <td className={`py-2 px-3 text-right font-semibold ${optimalColor(sc.optimalRate)}`}>
                  {sc.optimalRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage(page + 1)}
              className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfluenceSection({ data }: { data: AnalyticsData }) {
  const hasInfluence = data.influenceDistrib.some((b) => b.count > 0)

  return (
    <section className="mb-10">
      <SectionTitle>Influence Score™ Analytics</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <p className="text-sm font-semibold text-gray-700 mb-4">Influence Score™ Distribution</p>
          {!hasInfluence ? (
            <EmptyState message="No influence scores yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.influenceDistrib} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  formatter={(v) => [`${v} users`, "Count"]}
                  contentStyle={{ border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.influenceDistrib.map((entry) => (
                    <Cell key={entry.label} fill={INFLUENCE_COLORS[entry.label] ?? "#9CA3AF"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel>
          <p className="text-sm font-semibold text-gray-700 mb-4">Scenario Performance</p>
          <ScenarioTable scenarios={data.scenarios} />
        </Panel>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 5 — Exam & Recent Activity
// ---------------------------------------------------------------------------

function ExamPanel({ metrics }: { metrics: ExamMetrics | null }) {
  if (!metrics) return <EmptyState message="Exam not yet attempted by any users" />

  const passed = metrics.passedAttempts
  const failed = metrics.completedAttempts - metrics.passedAttempts
  const total  = metrics.completedAttempts

  return (
    <div>
      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: "Total Attempts",  value: metrics.totalAttempts },
          { label: "Pass Rate",       value: `${metrics.passRate}%` },
          { label: "Average Score",   value: `${metrics.averageScore}%` },
          { label: "Total Certified", value: metrics.certificatesIssued },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-[#1E3A5F]">{value}</p>
          </div>
        ))}
      </div>

      {/* Pass / fail bar */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Pass vs Fail</span>
            <span>{passed} passed · {failed} failed</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-red-100">
            <div
              className="bg-green-500 transition-all duration-700"
              style={{ width: `${(passed / total) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span className="text-green-600">{Math.round((passed / total) * 100)}% passed</span>
            <span className="text-red-500">{Math.round((failed / total) * 100)}% failed</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityFeed({ items }: { items: RecentActivityItem[] }) {
  if (!items.length) return <EmptyState message="No recent activity" />

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
          <span className="text-base leading-none mt-0.5 flex-shrink-0">{activityIcon(item.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 leading-snug truncate">{item.description}</p>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
            {relativeTime(item.occurredAt)}
          </span>
        </div>
      ))}
    </div>
  )
}

function ExamActivitySection({ data }: { data: AnalyticsData }) {
  return (
    <section className="mb-10">
      <SectionTitle>Exam &amp; Certification</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <p className="text-sm font-semibold text-gray-700 mb-4">Black Belt Exam</p>
          <ExamPanel metrics={data.examMetrics} />
        </Panel>
        <Panel>
          <p className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</p>
          <ActivityFeed items={data.recentActivity} />
        </Panel>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Resource Downloads table
// ---------------------------------------------------------------------------

function ResourceTable({ resources }: { resources: ResourceDownloadStat[] }) {
  if (!resources.length) {
    return (
      <EmptyState message="No downloads recorded yet" />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[540px] text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Lesson</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Module</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Downloads</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {resources.map((r) => (
            <tr key={r.resourceId} className="hover:bg-gray-50">
              <td className="py-2 px-3 font-medium text-gray-800 max-w-[180px] truncate">{r.fileName}</td>
              <td className="py-2 px-3 text-gray-600 max-w-[160px] truncate">{r.lessonTitle}</td>
              <td className="py-2 px-3 text-gray-600 max-w-[160px] truncate">{r.moduleTitle}</td>
              <td className="py-2 px-3 text-right font-bold text-[#1E3A5F]">{fmt(r.downloadCount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResourceSection({ resources }: { resources: ResourceDownloadStat[] }) {
  return (
    <section className="mb-10">
      <Panel>
        <SectionTitle>Most Downloaded Resources</SectionTitle>
        <ResourceTable resources={resources} />
      </Panel>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Root Dashboard
// ---------------------------------------------------------------------------

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  return (
    <div>
      <OverviewSection    data={data} />
      <UserGrowthSection  data={data.userGrowth} />
      <LearningSection    data={data} />
      <InfluenceSection   data={data} />
      <ExamActivitySection data={data} />
      <ResourceSection    resources={data.resources} />
    </div>
  )
}
