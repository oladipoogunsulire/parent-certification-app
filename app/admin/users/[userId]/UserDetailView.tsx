"use client"

import { useMemo } from "react"

// ---------------------------------------------------------------------------
// Types (exported so page.tsx can import them)
// ---------------------------------------------------------------------------

export interface UserDetailData {
  user: {
    id:           string
    email:        string
    name:         string | null
    firstName:    string | null
    lastName:     string | null
    displayName:  string | null
    image:        string | null
    role:         string
    isActive:     boolean
    currentBelt:  string | null
    beltEarnedAt: string | null
    createdAt:    string
    hasActiveSub: boolean
    influenceProfile: {
      influenceScore: number
      influenceLevel: string
      totalAttempts:  number
    } | null
  }
  lessonProgress: {
    lessonId:    string
    completed:   boolean
    completedAt: string | null
    moduleId:    string
    lessonTitle: string
  }[]
  scenarioAttempts: {
    scenarioId:    string
    scoreEarned:   number
    completedAt:   string
    scenarioTitle: string | null
    moduleId:      string
  }[]
  modules: {
    id:          string
    moduleTitle: string
    orderIndex:  number
    beltLevel:   string
    lessons:     { id: string; lessonTitle: string }[]
    scenarios:   { id: string; scenarioTitle: string | null }[]
  }[]
  examAttempts: {
    id:              string
    attemptNumber:   number
    startedAt:       string
    completedAt:     string | null
    score:           number | null
    passed:          boolean | null
    timeTakenSeconds: number | null
  }[]
  examCertificate: {
    certificateCode: string
    issuedAt:        string
    score:           number
  } | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BELT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "No Belt":     { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
  "White Belt":  { bg: "#F9FAFB", text: "#374151", border: "#D1D5DB" },
  "Yellow Belt": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Green Belt":  { bg: "#DCFCE7", text: "#166534", border: "#22C55E" },
  "Blue Belt":   { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
  "Black Belt":  { bg: "#1E3A5F", text: "#FFFFFF", border: "#1E3A5F" },
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function getDisplayName(u: UserDetailData["user"]): string {
  if (u.displayName) return u.displayName
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
  if (full) return full
  if (u.name) return u.name
  return u.email.split("@")[0]
}

function getInitials(u: UserDetailData["user"]): string {
  const name = getDisplayName(u)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

// ---------------------------------------------------------------------------
// Reusable UI atoms
// ---------------------------------------------------------------------------

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-[#1E3A5F] mb-4">{children}</h3>
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 border-l-4 border-l-[#1E3A5F]">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-[#1E3A5F]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BeltBadge({ belt }: { belt: string | null }) {
  const label = belt ?? "No Belt"
  const color = BELT_COLORS[label] ?? BELT_COLORS["No Belt"]
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ background: color.bg, color: color.text, borderColor: color.border }}
    >
      {label}
    </span>
  )
}

function MiniProgress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const colour = pct === 100 ? "#22C55E" : pct > 0 ? "#F97316" : "#E5E7EB"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: colour }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{value}/{max}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 0 — Header
// ---------------------------------------------------------------------------

function Header({ user }: { user: UserDetailData["user"] }) {
  const displayName = getDisplayName(user)
  const initials    = getInitials(user)
  const belt        = user.currentBelt ?? "No Belt"
  const beltColor   = BELT_COLORS[belt] ?? BELT_COLORS["No Belt"]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <a href="/admin/users" className="hover:text-[#1E3A5F] transition-colors">Users</a>
        <span>›</span>
        <span className="text-gray-700 font-medium truncate">{displayName}</span>
      </nav>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ring-2 ring-gray-100 border"
            style={{ background: beltColor.bg, color: beltColor.text, borderColor: beltColor.border }}
          >
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-[#1E3A5F] truncate">{displayName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString("en-GB", {
              month: "long", year: "numeric",
            })}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user.role === "ADMIN"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {user.role}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user.hasActiveSub
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {user.hasActiveSub ? "Active" : "Free"}
            </span>
            <BeltBadge belt={user.currentBelt} />
          </div>
        </div>

        <a
          href="/admin/users"
          className="text-sm text-[#1E3A5F] hover:underline whitespace-nowrap flex-shrink-0"
        >
          ← Back to Users
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 1 — Influence Journey Summary
// ---------------------------------------------------------------------------

function InfluenceSummary({
  user,
  completedModuleCount,
  uniqueScenariosAttempted,
}: {
  user: UserDetailData["user"]
  completedModuleCount: number
  uniqueScenariosAttempted: number
}) {
  const score = user.influenceProfile?.influenceScore ?? 0
  const level = user.influenceProfile?.influenceLevel ?? "—"

  return (
    <section className="mb-6">
      <SectionTitle>Influence Journey</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Influence Score"
          value={`${Math.round(score)}/100`}
          sub={level}
        />
        <StatCard
          label="Modules Completed"
          value={`${completedModuleCount} of 10`}
          sub={completedModuleCount >= 10 ? "All modules done 🎉" : undefined}
        />
        <StatCard
          label="Scenarios Attempted"
          value={uniqueScenariosAttempted}
          sub="unique scenarios"
        />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 2 — Module Progress Breakdown
// ---------------------------------------------------------------------------

type ModuleStatus = "not_started" | "in_progress" | "complete"

interface ModuleRow {
  id:                string
  moduleTitle:       string
  orderIndex:        number
  beltLevel:         string
  totalLessons:      number
  completedLessons:  number
  totalScenarios:    number
  attemptedScenarios: number
  status:            ModuleStatus
  completedAt:       string | null
}

function statusBadge(status: ModuleStatus) {
  if (status === "complete") return (
    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      ✓ Complete
    </span>
  )
  if (status === "in_progress") return (
    <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      In Progress
    </span>
  )
  return (
    <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
      Not Started
    </span>
  )
}

function ModuleBreakdown({ rows }: { rows: ModuleRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-gray-400 py-4">No module data available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">#</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Module</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Belt</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase w-36">Lessons</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase w-36">Scenarios</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="py-3 px-3 text-gray-400 text-xs">{row.orderIndex}</td>
              <td className="py-3 px-3 font-medium text-gray-800">{row.moduleTitle}</td>
              <td className="py-3 px-3">
                <BeltBadge belt={row.beltLevel} />
              </td>
              <td className="py-3 px-3">
                <MiniProgress value={row.completedLessons} max={row.totalLessons} />
              </td>
              <td className="py-3 px-3">
                <MiniProgress value={row.attemptedScenarios} max={row.totalScenarios} />
              </td>
              <td className="py-3 px-3">{statusBadge(row.status)}</td>
              <td className="py-3 px-3 text-xs text-gray-400">{formatDate(row.completedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 3 — Scenario Performance
// ---------------------------------------------------------------------------

interface ScenarioRow {
  scenarioId:    string
  scenarioTitle: string
  moduleName:    string
  attempts:      number
  bestScore:     number
  lastAttempted: string
}

function ScenarioPerformance({ rows }: { rows: ScenarioRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-gray-400 py-4 text-center">No scenarios attempted yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Scenario</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Module</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Attempts</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Best Score</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Last Attempted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.scenarioId} className="hover:bg-gray-50">
              <td className="py-2.5 px-3 font-medium text-gray-800 max-w-[200px] truncate">
                {row.scenarioTitle}
              </td>
              <td className="py-2.5 px-3 text-gray-500 max-w-[160px] truncate">{row.moduleName}</td>
              <td className="py-2.5 px-3 text-right text-gray-600">{row.attempts}</td>
              <td className="py-2.5 px-3 text-right font-semibold text-[#1E3A5F]">
                {Math.round(row.bestScore)}
              </td>
              <td className="py-2.5 px-3 text-right text-xs text-gray-400">
                {formatDate(row.lastAttempted)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 4 — Exam History
// ---------------------------------------------------------------------------

function ExamHistory({
  attempts,
  certificate,
  userId,
}: {
  attempts:    UserDetailData["examAttempts"]
  certificate: UserDetailData["examCertificate"]
  userId:      string
}) {
  return (
    <div>
      {attempts.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No exam attempts yet.</p>
      ) : (
        <div className="overflow-x-auto mb-4">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Attempt</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attempts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">#{a.attemptNumber}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{formatDate(a.startedAt)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#1E3A5F]">
                    {a.score !== null ? `${Math.round(a.score)}%` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {a.passed === null ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : a.passed ? (
                      <span className="text-green-600 font-medium text-sm">✅ Passed</span>
                    ) : (
                      <span className="text-red-500 font-medium text-sm">❌ Failed</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs text-gray-400">
                    {formatTime(a.timeTakenSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {certificate && (
        <div className="bg-[#1E3A5F] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>🥋</span>
            <div>
              <p className="text-white font-bold text-sm">Certified Ultimate Influencer™</p>
              <p className="text-white/60 text-xs mt-0.5">
                Issued {formatDate(certificate.issuedAt)} · Score: {Math.round(certificate.score)}%
              </p>
              <p className="text-white/40 text-xs font-mono mt-0.5">
                ID: {certificate.certificateCode}
              </p>
            </div>
          </div>
          <a
            href={`/certificate/${userId}`}
            className="ml-auto bg-yellow-400 hover:bg-yellow-300 text-[#1E3A5F] font-bold text-xs px-4 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            View Certificate
          </a>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 5 — Recent Activity
// ---------------------------------------------------------------------------

interface ActivityItem {
  type:      "lesson" | "scenario" | "exam_pass" | "exam_fail" | "belt"
  label:     string
  date:      string
  sortKey:   string
}

function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-gray-400 py-4">No recent activity.</p>
  }

  function icon(type: ActivityItem["type"]) {
    switch (type) {
      case "lesson":    return "✅"
      case "scenario":  return "🎯"
      case "exam_pass": return "📜"
      case "exam_fail": return "📝"
      case "belt":      return "🥋"
    }
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
          <span className="text-base leading-none mt-0.5 flex-shrink-0">{icon(item.type)}</span>
          <p className="text-sm text-gray-700 flex-1 leading-snug">{item.label}</p>
          <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
            {relativeDate(item.date)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function UserDetailView({ data }: { data: UserDetailData }) {
  const { user, lessonProgress, scenarioAttempts, modules, examAttempts, examCertificate } = data

  // ── Build module rows ──────────────────────────────────────────────────
  const moduleRows = useMemo((): ModuleRow[] => {
    const completedLessonIds = new Set(
      lessonProgress.filter((lp) => lp.completed).map((lp) => lp.lessonId)
    )
    const attemptedScenarioIds = new Set(scenarioAttempts.map((sa) => sa.scenarioId))

    // Latest completedAt per moduleId (from lessons)
    const latestCompletionPerModule = new Map<string, string>()
    for (const lp of lessonProgress) {
      if (lp.completed && lp.completedAt) {
        const existing = latestCompletionPerModule.get(lp.moduleId)
        if (!existing || lp.completedAt > existing) {
          latestCompletionPerModule.set(lp.moduleId, lp.completedAt)
        }
      }
    }

    return modules.map((mod) => {
      const totalLessons      = mod.lessons.length
      const completedLessons  = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length
      const totalScenarios    = mod.scenarios.length
      const attemptedScenarios = mod.scenarios.filter((s) => attemptedScenarioIds.has(s.id)).length

      let status: ModuleStatus = "not_started"
      const allLessonsDone     = totalLessons > 0 && completedLessons === totalLessons
      const allScenariosDone   = totalScenarios === 0 || attemptedScenarios === totalScenarios
      if (allLessonsDone && allScenariosDone) {
        status = "complete"
      } else if (completedLessons > 0 || attemptedScenarios > 0) {
        status = "in_progress"
      }

      return {
        id:                mod.id,
        moduleTitle:       mod.moduleTitle,
        orderIndex:        mod.orderIndex,
        beltLevel:         mod.beltLevel,
        totalLessons,
        completedLessons,
        totalScenarios,
        attemptedScenarios,
        status,
        completedAt:       status === "complete" ? (latestCompletionPerModule.get(mod.id) ?? null) : null,
      }
    })
  }, [lessonProgress, scenarioAttempts, modules])

  // ── Computed summary stats ─────────────────────────────────────────────
  const completedModuleCount    = useMemo(() => moduleRows.filter((r) => r.status === "complete").length, [moduleRows])
  const uniqueScenariosAttempted = useMemo(() => new Set(scenarioAttempts.map((sa) => sa.scenarioId)).size, [scenarioAttempts])

  // ── Build scenario performance rows ───────────────────────────────────
  const scenarioRows = useMemo((): ScenarioRow[] => {
    const byScenario = new Map<string, {
      title: string; moduleName: string; attempts: number; bestScore: number; lastAttempted: string
    }>()
    const moduleMap = new Map(modules.map((m) => [m.id, m.moduleTitle]))

    for (const sa of scenarioAttempts) {
      const existing = byScenario.get(sa.scenarioId)
      if (existing) {
        existing.attempts++
        if (sa.scoreEarned > existing.bestScore) existing.bestScore = sa.scoreEarned
        if (sa.completedAt > existing.lastAttempted) existing.lastAttempted = sa.completedAt
      } else {
        byScenario.set(sa.scenarioId, {
          title:         sa.scenarioTitle ?? "Untitled Scenario",
          moduleName:    moduleMap.get(sa.moduleId) ?? "—",
          attempts:      1,
          bestScore:     sa.scoreEarned,
          lastAttempted: sa.completedAt,
        })
      }
    }

    return Array.from(byScenario.entries())
      .map(([scenarioId, v]) => ({
        scenarioId,
        scenarioTitle: v.title,
        moduleName:    v.moduleName,
        attempts:      v.attempts,
        bestScore:     v.bestScore,
        lastAttempted: v.lastAttempted,
      }))
      .sort((a, b) => b.lastAttempted.localeCompare(a.lastAttempted))
  }, [scenarioAttempts, modules])

  // ── Build activity feed ────────────────────────────────────────────────
  const activityFeed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []

    // Completed lessons
    for (const lp of lessonProgress) {
      if (lp.completed && lp.completedAt) {
        items.push({
          type:    "lesson",
          label:   `Completed lesson: "${lp.lessonTitle}"`,
          date:    lp.completedAt,
          sortKey: lp.completedAt,
        })
      }
    }

    // Scenario attempts
    for (const sa of scenarioAttempts) {
      items.push({
        type:    "scenario",
        label:   `Attempted scenario: "${sa.scenarioTitle ?? "Untitled"}" — scored ${Math.round(sa.scoreEarned)}`,
        date:    sa.completedAt,
        sortKey: sa.completedAt,
      })
    }

    // Exam attempts
    for (const ea of examAttempts) {
      if (ea.completedAt && ea.score !== null) {
        items.push({
          type:    ea.passed ? "exam_pass" : "exam_fail",
          label:   ea.passed
            ? `Passed Black Belt exam — scored ${Math.round(ea.score)}%`
            : `Attempted Black Belt exam — scored ${Math.round(ea.score)}%`,
          date:    ea.completedAt,
          sortKey: ea.completedAt,
        })
      }
    }

    // Sort descending, take 20
    items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    return items.slice(0, 20)
  }, [lessonProgress, scenarioAttempts, examAttempts])

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl">
      <Header user={user} />

      {/* Section 1 */}
      <Panel className="mb-6">
        <InfluenceSummary
          user={user}
          completedModuleCount={completedModuleCount}
          uniqueScenariosAttempted={uniqueScenariosAttempted}
        />
      </Panel>

      {/* Section 2 */}
      <Panel className="mb-6">
        <SectionTitle>Module Progress Breakdown</SectionTitle>
        <ModuleBreakdown rows={moduleRows} />
      </Panel>

      {/* Section 3 */}
      <Panel className="mb-6">
        <SectionTitle>Scenario Performance</SectionTitle>
        <ScenarioPerformance rows={scenarioRows} />
      </Panel>

      {/* Section 4 */}
      <Panel className="mb-6">
        <SectionTitle>Exam History</SectionTitle>
        <ExamHistory
          attempts={examAttempts}
          certificate={examCertificate}
          userId={user.id}
        />
      </Panel>

      {/* Section 5 */}
      <Panel className="mb-6">
        <SectionTitle>Recent Activity</SectionTitle>
        <RecentActivity items={activityFeed} />
      </Panel>
    </div>
  )
}
