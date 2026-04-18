"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttemptSummary {
  id: string
  attemptNumber: number
  completedAt: string | null
  score: number
  passed: boolean
  timeTakenSeconds: number | null
}

interface ExamConfig {
  totalQuestions: number
  isTimed: boolean
  timeLimitMinutes: number
  passingThreshold: number
}

interface Props {
  examEnabled: boolean
  eligible: boolean
  reason: string | null
  completedModuleCount: number
  history: AttemptSummary[]
  config: ExamConfig
  hasCertificate: boolean
  userId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExamLandingClient({
  examEnabled,
  eligible,
  completedModuleCount,
  history,
  config,
  hasCertificate,
  userId,
}: Props) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const hasAttempts = history.length > 0
  const bestScore   = hasAttempts ? Math.max(...history.map((h) => h.score)) : null
  const hasPassed   = history.some((h) => h.passed)

  // ── State A — exam feature disabled ─────────────────────────────────────
  if (!examEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-6" aria-hidden>🔒</div>
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-3">
          The Black Belt exam is coming soon
        </h1>
        <p className="text-foreground/60 max-w-sm">
          Complete all 10 modules to prepare. The exam will be available once you
          finish the full curriculum.
        </p>
        <a
          href="/modules"
          className="mt-8 inline-flex items-center min-h-[48px] bg-[#F97316] hover:bg-[#e06810] text-white font-semibold text-sm px-6 rounded-xl transition-colors"
        >
          Continue learning →
        </a>
      </div>
    )
  }

  // ── State B — not eligible (modules incomplete) ──────────────────────────
  if (!eligible) {
    const pct = Math.round((completedModuleCount / 10) * 100)
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">Black Belt Exam</h1>
        <p className="text-foreground/60 mb-8">
          Complete all 10 modules to unlock the certification exam.
        </p>

        {/* Progress card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Module progress</span>
            <span className="text-sm font-bold text-[#F97316]">
              {completedModuleCount} / 10
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-3">
            <div
              className="bg-[#F97316] h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-foreground/50">
            {10 - completedModuleCount} module{10 - completedModuleCount !== 1 ? "s" : ""} remaining
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
          Complete all 10 modules to unlock the Black Belt exam
        </div>

        <a
          href="/modules"
          className="inline-flex items-center min-h-[48px] bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold text-sm px-6 rounded-xl transition-colors"
        >
          Continue learning →
        </a>
      </div>
    )
  }

  // ── Start exam handler ────────────────────────────────────────────────────
  async function handleStartExam() {
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch("/api/exam/start", { method: "POST" })
      const data = await res.json() as {
        attemptId?: string
        questions?: unknown[]
        config?: ExamConfig
        error?: string
      }
      if (!res.ok || !data.attemptId || !data.questions || !data.config) {
        setStartError(data.error ?? "Failed to start exam. Please try again.")
        return
      }
      // Store in sessionStorage so ExamPlayer can load questions
      sessionStorage.setItem(
        `exam_${data.attemptId}`,
        JSON.stringify({ questions: data.questions, config: data.config })
      )
      router.push(`/exam/${data.attemptId}`)
    } catch {
      setStartError("Network error. Please check your connection and try again.")
    } finally {
      setStarting(false)
    }
  }

  // ── State C — eligible, no previous attempts ──────────────────────────────
  if (!hasAttempts) {
    return (
      <div>
        <div className="mb-2 inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-wider">
          <span>🥋</span> Black Belt Certification
        </div>
        <h1 className="text-3xl font-extrabold text-[#1E3A5F] mb-2">
          Black Belt Exam
        </h1>
        <p className="text-foreground/60 mb-8">
          You've mastered the curriculum. Prove it.
        </p>

        {/* Exam details card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">
            Black Belt Certification Exam
          </h2>
          <p className="text-sm text-foreground/70 mb-6 leading-relaxed">
            This exam tests your mastery of the entire Ultimate Influencer™ curriculum.
            Answer every question carefully — you need {config.passingThreshold}% to pass.
          </p>
          <dl className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <dt className="text-xs text-foreground/50 mb-1">Questions</dt>
              <dd className="text-2xl font-bold text-[#1E3A5F]">{config.totalQuestions}</dd>
            </div>
            {config.isTimed && (
              <div className="bg-gray-50 rounded-xl p-4">
                <dt className="text-xs text-foreground/50 mb-1">Time limit</dt>
                <dd className="text-2xl font-bold text-[#1E3A5F]">{config.timeLimitMinutes} min</dd>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-4">
              <dt className="text-xs text-foreground/50 mb-1">Passing score</dt>
              <dd className="text-2xl font-bold text-[#1E3A5F]">{config.passingThreshold}%</dd>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <dt className="text-xs text-foreground/50 mb-1">Attempts</dt>
              <dd className="text-2xl font-bold text-[#1E3A5F]">Unlimited</dd>
            </div>
          </dl>
        </div>

        {startError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
            {startError}
          </div>
        )}

        <button
          onClick={handleStartExam}
          disabled={starting}
          className="w-full min-h-[56px] bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-50 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {starting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Preparing exam…
            </>
          ) : (
            "Begin Exam →"
          )}
        </button>
      </div>
    )
  }

  // ── State D — eligible, has previous attempts ─────────────────────────────
  return (
    <div>
      <div className="mb-2 inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-wider">
        <span>🥋</span> Black Belt Certification
      </div>
      <h1 className="text-3xl font-extrabold text-[#1E3A5F] mb-2">
        Black Belt Exam
      </h1>
      <p className="text-foreground/60 mb-6">
        {hasPassed ? "You've passed! Your certificate is ready." : "Keep going — you're getting closer."}
      </p>

      {/* Certificate banner */}
      {hasCertificate && hasPassed && (
        <div className="bg-[#1E3A5F] rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>🏆</span>
            <div>
              <p className="text-white font-bold text-sm">Black Belt Certified</p>
              <p className="text-white/60 text-xs">The Ultimate Influencer™</p>
            </div>
          </div>
          <a
            href={`/certificate/${userId}`}
            className="flex-shrink-0 bg-yellow-400 hover:bg-yellow-300 text-[#1E3A5F] font-bold text-xs px-4 py-2 rounded-lg transition-colors min-h-[36px] flex items-center"
          >
            View Certificate
          </a>
        </div>
      )}

      {/* Best score highlight */}
      {bestScore !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center gap-4">
          <div className="text-center min-w-[64px]">
            <p className="text-xs text-foreground/40 mb-1">Best score</p>
            <p className={`text-3xl font-black ${bestScore >= config.passingThreshold ? "text-green-600" : "text-[#1E3A5F]"}`}>
              {Math.round(bestScore)}%
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${bestScore >= config.passingThreshold ? "bg-green-500" : "bg-[#F97316]"}`}
                style={{ width: `${Math.min(100, Math.round(bestScore))}%` }}
              />
            </div>
            <p className="text-xs text-foreground/40 mt-1">
              Pass threshold: {config.passingThreshold}%
            </p>
          </div>
        </div>
      )}

      {/* Attempt history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-foreground">Attempt history</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {history.map((attempt) => {
            const isBest = attempt.score === bestScore
            return (
              <div key={attempt.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex-shrink-0 w-2 h-2 rounded-full ${attempt.passed ? "bg-green-500" : "bg-gray-300"}`}
                    title={attempt.passed ? "Passed" : "Not passed"}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Attempt {attempt.attemptNumber}
                      {isBest && (
                        <span className="ml-2 text-xs font-normal text-[#F97316]">Best</span>
                      )}
                    </p>
                    <p className="text-xs text-foreground/40">{formatDate(attempt.completedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {attempt.timeTakenSeconds !== null && (
                    <span className="text-xs text-foreground/40 hidden sm:inline">
                      {formatTime(attempt.timeTakenSeconds)}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${attempt.passed ? "text-green-600" : "text-foreground"}`}>
                    {Math.round(attempt.score)}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    attempt.passed
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {startError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {startError}
        </div>
      )}

      <button
        onClick={handleStartExam}
        disabled={starting}
        className="w-full min-h-[56px] bg-[#1E3A5F] hover:bg-[#162d4a] disabled:opacity-50 text-white font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {starting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Preparing exam…
          </>
        ) : (
          hasPassed ? "Retake Exam →" : "Retake Exam →"
        )}
      </button>
    </div>
  )
}
