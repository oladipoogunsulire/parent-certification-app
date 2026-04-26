"use client"

import { useState } from "react"
import type { ContentHealthReport, ContentFlag, ModuleHealthReport } from "@/lib/content-health"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-500"
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200"
  if (score >= 60) return "bg-amber-50 border-amber-200"
  return "bg-red-50 border-red-200"
}

const SEVERITY_STYLES = {
  critical: { badge: "bg-red-100 text-red-700",    dot: "bg-red-500",   label: "Critical" },
  warning:  { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", label: "Warning"  },
  info:     { badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500",  label: "Info"     },
} as const

type FilterTab = "all" | "critical" | "warning" | "info"

const BELT_COLORS: Record<string, string> = {
  "White Belt":  "bg-gray-100 text-gray-700",
  "Yellow Belt": "bg-yellow-100 text-yellow-700",
  "Green Belt":  "bg-green-100 text-green-700",
  "Blue Belt":   "bg-blue-100 text-blue-700",
  "Black Belt":  "bg-gray-900 text-white",
}

// ---------------------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------------------

function SummaryCards({ report }: { report: ContentHealthReport }) {
  const { summary, flags } = report
  const criticalCount = flags.filter((f) => f.severity === "critical").length
  const warningCount  = flags.filter((f) => f.severity === "warning").length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {/* Health score — spans 2 cols on lg */}
      <div className={`col-span-2 lg:col-span-2 border rounded-xl p-5 flex flex-col justify-between ${scoreBg(summary.healthScore)}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Overall Health Score</p>
        <div className="flex items-end gap-2">
          <span className={`text-5xl font-black ${scoreColor(summary.healthScore)}`}>
            {summary.healthScore}
          </span>
          <span className="text-lg text-gray-400 mb-1">/ 100</span>
        </div>
        <div className="mt-3 w-full bg-white/60 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${scoreBarColor(summary.healthScore)}`}
            style={{ width: `${summary.healthScore}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Average across active modules</p>
      </div>

      <StatCard label="Modules"   value={summary.totalModules}   />
      <StatCard label="Lessons"   value={summary.totalLessons}   />
      <StatCard label="Scenarios" value={summary.totalScenarios} />

      {/* Critical issues */}
      <div className={`border rounded-xl p-5 ${criticalCount > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Critical Issues</p>
        <p className={`text-4xl font-black ${criticalCount > 0 ? "text-red-600" : "text-green-600"}`}>
          {criticalCount}
        </p>
        <p className="text-xs text-gray-500 mt-1">{warningCount} warnings</p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 bg-white rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-4xl font-black text-[#1E3A5F]">{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Flags panel
// ---------------------------------------------------------------------------

function FlagsPanel({ flags }: { flags: ContentFlag[] }) {
  const [tab, setTab] = useState<FilterTab>("all")

  const counts = {
    all:      flags.length,
    critical: flags.filter((f) => f.severity === "critical").length,
    warning:  flags.filter((f) => f.severity === "warning").length,
    info:     flags.filter((f) => f.severity === "info").length,
  }

  const filtered = tab === "all" ? flags : flags.filter((f) => f.severity === tab)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all",      label: `All (${counts.all})`           },
    { key: "critical", label: `Critical (${counts.critical})` },
    { key: "warning",  label: `Warnings (${counts.warning})`  },
    { key: "info",     label: `Info (${counts.info})`         },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-8 overflow-hidden">
      <div className="px-5 pt-5 pb-0 border-b border-gray-100">
        <h3 className="text-base font-bold text-[#1E3A5F] mb-3">Content Flags</h3>

        {/* No criticals banner */}
        {counts.critical === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-3 text-sm text-green-700 font-medium">
            ✓ No critical issues — great work!
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors focus:outline-none ${
                tab === key
                  ? "bg-[#1E3A5F] text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          No {tab === "all" ? "" : tab} flags
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((flag, i) => (
            <FlagRow key={i} flag={flag} />
          ))}
        </div>
      )}
    </div>
  )
}

function FlagRow({ flag }: { flag: ContentFlag }) {
  const style = SEVERITY_STYLES[flag.severity]
  return (
    <div className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
            {style.label}
          </span>
          <span className="text-sm font-medium text-gray-800 truncate">{flag.module}</span>
          {flag.lesson && (
            <>
              <span className="text-gray-400 text-xs">›</span>
              <span className="text-sm text-gray-600 truncate">{flag.lesson}</span>
            </>
          )}
          {flag.scenario && (
            <>
              <span className="text-gray-400 text-xs">›</span>
              <span className="text-sm text-gray-600 truncate">{flag.scenario}</span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-700">{flag.issue}</p>
        <p className="text-xs text-gray-400 mt-0.5">→ {flag.action}</p>
      </div>
      <a
        href={flag.fixUrl}
        className="shrink-0 text-xs font-semibold text-[#F97316] hover:underline whitespace-nowrap"
      >
        Fix it →
      </a>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module breakdown
// ---------------------------------------------------------------------------

function ModuleBreakdown({ modules }: { modules: ModuleHealthReport[] }) {
  // Sort by completeness ascending — most incomplete first
  const sorted = [...modules].sort((a, b) => a.completenessScore - b.completenessScore)

  return (
    <div>
      <h3 className="text-base font-bold text-[#1E3A5F] mb-4">
        Module Breakdown
        <span className="ml-2 text-sm font-normal text-gray-400">(most incomplete first)</span>
      </h3>

      {sorted.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-400">
          No modules found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((m) => (
            <ModuleCard key={m.moduleId} module={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function ModuleCard({ module: m }: { module: ModuleHealthReport }) {
  const beltClass = BELT_COLORS[m.beltLevel] ?? "bg-gray-100 text-gray-700"

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${beltClass}`}>
              {m.beltLevel}
            </span>
            {!m.isActive && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                Inactive
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-gray-900 leading-snug">{m.moduleName}</h4>
        </div>
        <span className={`text-xl font-black shrink-0 ${scoreColor(m.completenessScore)}`}>
          {m.completenessScore}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${scoreBarColor(m.completenessScore)}`}
          style={{ width: `${m.completenessScore}%` }}
        />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <span className="font-semibold text-gray-800">
            {m.lessonsWithVideo}/{m.lessonCount}
          </span>{" "}
          lessons with video
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <span className="font-semibold text-gray-800">
            {m.lessonsWithContent}/{m.lessonCount}
          </span>{" "}
          lessons with content
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <span className="font-semibold text-gray-800">
            {m.scenariosWithScoredResponses}/{m.scenarioCount}
          </span>{" "}
          scenarios scored
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <span className="font-semibold text-gray-800">
            {m.scenariosWithExplanations}/{m.scenarioCount}
          </span>{" "}
          scenarios explained
        </div>
      </div>

      {/* Issues list */}
      {m.issues.length > 0 && (
        <div className="border-t border-gray-100 pt-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">Issues</p>
          <ul className="space-y-1">
            {m.issues.slice(0, 5).map((issue, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                <span className="mt-0.5 shrink-0">•</span>
                <span className="line-clamp-2">{issue}</span>
              </li>
            ))}
            {m.issues.length > 5 && (
              <li className="text-xs text-gray-400">+{m.issues.length - 5} more issues</li>
            )}
          </ul>
        </div>
      )}

      {/* View link */}
      <div className="mt-auto pt-1">
        <a
          href={`/admin/tracks/${m.trackId}/modules/${m.moduleId}`}
          className="text-xs font-semibold text-[#1E3A5F] hover:underline"
        >
          View module →
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function ContentHealthDashboard({ report }: { report: ContentHealthReport }) {
  return (
    <div>
      <SummaryCards report={report} />
      <FlagsPanel flags={report.flags} />
      <ModuleBreakdown modules={report.modules} />
    </div>
  )
}
