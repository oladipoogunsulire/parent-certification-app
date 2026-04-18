"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import BeltAwardModal from "@/app/components/BeltAwardModal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuestionOption {
  id: string
  optionText: string
  explanation: string | null
  displayOrder: number
}

interface Question {
  id: string
  questionText: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  moduleTag: string | null
  options: QuestionOption[]
}

interface ExamConfig {
  totalQuestions: number
  isTimed: boolean
  timeLimitMinutes: number
  passingThreshold: number
}

interface AnswerFeedback {
  isCorrect: boolean
  correctOptionId: string
  explanation: string | null
}

interface ExamResultData {
  attempt: { id: string; userId: string; score: number; passed: boolean; timeTakenSeconds: number | null }
  score: number
  passed: boolean
  correctCount: number
  totalCount: number
  timeTakenSeconds: number | null
  passingThreshold: number
  certificate: { certificateCode: string } | null
  beltUpdate: { beltChanged: boolean; newBelt: string | null }
}

interface AnsweredQuestion {
  questionId: string
  moduleTag: string | null
  isCorrect: boolean
}

type Phase = "loading" | "question" | "feedback" | "completing" | "results" | "error"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatTimeTaken(seconds: number | null): string {
  if (seconds === null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m} min ${s} sec`
}

const DIFFICULTY_BADGE: Record<string, string> = {
  EASY:   "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HARD:   "bg-red-100 text-red-700",
}

// ---------------------------------------------------------------------------
// ExamPlayer
// ---------------------------------------------------------------------------

export default function ExamPlayer({
  attemptId,
  userId,
}: {
  attemptId: string
  userId: string
}) {
  const [phase, setPhase]               = useState<Phase>("loading")
  const [questions, setQuestions]       = useState<Question[]>([])
  const [config, setConfig]             = useState<ExamConfig | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [feedback, setFeedback]         = useState<AnswerFeedback | null>(null)
  const [result, setResult]             = useState<ExamResultData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [answeredQs, setAnsweredQs]     = useState<AnsweredQuestion[]>([])
  const [showBeltModal, setShowBeltModal] = useState(false)
  const [apiError, setApiError]         = useState<string | null>(null)

  const timerStarted   = useRef(false)
  const hasCompleted   = useRef(false)
  const pollIntervalId = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load questions from sessionStorage on mount ─────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem(`exam_${attemptId}`)
    if (!stored) {
      setPhase("error")
      return
    }
    try {
      const parsed = JSON.parse(stored) as { questions: Question[]; config: ExamConfig }
      setQuestions(parsed.questions)
      setConfig(parsed.config)
      setPhase("question")
    } catch {
      setPhase("error")
    }
  }, [attemptId])

  // ── Fetch server progress for timer sync + resume offset ─────────────────
  const syncProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/exam/progress/${attemptId}`)
      if (!res.ok) return
      const data = await res.json() as {
        timeRemainingSeconds: number | null
        answeredCount: number
        totalQuestions: number
      }
      // Resync timer from server
      if (data.timeRemainingSeconds !== null) {
        setTimeRemaining(data.timeRemainingSeconds)
      }
      // On first load, advance to the correct question if resuming mid-exam
      if (!timerStarted.current && data.answeredCount > 0) {
        setCurrentIndex(data.answeredCount)
      }
    } catch { /* network hiccup — ignore, local countdown continues */ }
  }, [attemptId])

  // ── Start timer once questions are loaded (isTimed only) ─────────────────
  useEffect(() => {
    if (phase !== "question" || !config?.isTimed || timerStarted.current) return
    timerStarted.current = true

    // Get initial time from server
    syncProgress()

    // Server sync poll every 30 s
    pollIntervalId.current = setInterval(syncProgress, 30_000)

    return () => {
      if (pollIntervalId.current) clearInterval(pollIntervalId.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, config])

  // ── Countdown tick (runs after server gives us an initial value) ──────────
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return
    if (phase === "results" || phase === "completing") return

    const id = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  // Only re-run when first initialised from server sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining === null ? null : "initialized", phase])

  // ── Auto-complete when timer hits zero ────────────────────────────────────
  useEffect(() => {
    if (
      timeRemaining === 0 &&
      !hasCompleted.current &&
      phase !== "results" &&
      phase !== "completing"
    ) {
      hasCompleted.current = true
      void doComplete()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  // ── Complete exam ─────────────────────────────────────────────────────────
  const doComplete = useCallback(async () => {
    if (pollIntervalId.current) clearInterval(pollIntervalId.current)
    setPhase("completing")
    setApiError(null)
    try {
      const res = await fetch("/api/exam/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      })
      const data = await res.json() as ExamResultData & { error?: string }
      if (!res.ok) {
        setApiError(data.error ?? "Failed to complete exam.")
        setPhase("question")
        return
      }
      setResult(data)
      setPhase("results")
      sessionStorage.removeItem(`exam_${attemptId}`)
      if (data.passed) setShowBeltModal(true)
    } catch {
      setApiError("Network error. Please try again.")
      setPhase("question")
    }
  }, [attemptId])

  // ── Submit an answer ──────────────────────────────────────────────────────
  async function handleSubmitAnswer() {
    if (!selectedId || submitting) return
    const q = questions[currentIndex]
    setSubmitting(true)
    setApiError(null)
    try {
      const res = await fetch("/api/exam/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: q.id, selectedOptionId: selectedId }),
      })
      const data = await res.json() as AnswerFeedback & { error?: string }
      if (!res.ok) {
        setApiError(data.error ?? "Failed to record answer.")
        return
      }
      setFeedback(data)
      setAnsweredQs((prev) => [
        ...prev,
        { questionId: q.id, moduleTag: q.moduleTag, isCorrect: data.isCorrect },
      ])
      setPhase("feedback")
    } catch {
      setApiError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Advance to next question (or complete) ────────────────────────────────
  function handleNext() {
    const isLastQuestion = currentIndex >= questions.length - 1
    if (isLastQuestion) {
      hasCompleted.current = true
      void doComplete()
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedId(null)
      setFeedback(null)
      setPhase("question")
    }
  }

  // ── Save & exit ───────────────────────────────────────────────────────────
  function handleSaveExit() {
    if (pollIntervalId.current) clearInterval(pollIntervalId.current)
    window.location.href = "/exam"
  }

  // ── Retry after fail ──────────────────────────────────────────────────────
  async function handleRetake() {
    try {
      const res  = await fetch("/api/exam/start", { method: "POST" })
      const data = await res.json() as { attemptId?: string; questions?: unknown[]; config?: ExamConfig; error?: string }
      if (!res.ok || !data.attemptId || !data.questions || !data.config) {
        setApiError(data.error ?? "Failed to start new attempt.")
        return
      }
      sessionStorage.setItem(
        `exam_${data.attemptId}`,
        JSON.stringify({ questions: data.questions, config: data.config })
      )
      window.location.href = `/exam/${data.attemptId}`
    } catch {
      setApiError("Network error. Please try again.")
    }
  }

  // ── Module breakdown for failed attempts ──────────────────────────────────
  function getWeakModules(): Array<{ tag: string; incorrect: number; total: number }> {
    const map = new Map<string, { incorrect: number; total: number }>()
    for (const a of answeredQs) {
      const tag = a.moduleTag ?? "General"
      const prev = map.get(tag) ?? { incorrect: 0, total: 0 }
      map.set(tag, {
        incorrect: prev.incorrect + (a.isCorrect ? 0 : 1),
        total:     prev.total + 1,
      })
    }
    return [...map.entries()]
      .map(([tag, v]) => ({ tag, ...v }))
      .filter((v) => v.incorrect > 0)
      .sort((a, b) => b.incorrect - a.incorrect)
      .slice(0, 3)
  }

  // ---------------------------------------------------------------------------
  // ── Render: Error (questions not found) ───────────────────────────────────
  // ---------------------------------------------------------------------------
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4" aria-hidden>⚠️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Session expired</h1>
          <p className="text-sm text-foreground/60 mb-6">
            Your exam session couldn't be restored. Return to the exam page to continue
            or start a new attempt.
          </p>
          <a
            href="/exam"
            className="inline-flex items-center justify-center w-full min-h-[48px] bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Back to exam page
          </a>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // ── Render: Loading ────────────────────────────────────────────────────────
  // ---------------------------------------------------------------------------
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-foreground/50">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Loading exam…</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // ── Render: Results ────────────────────────────────────────────────────────
  // ---------------------------------------------------------------------------
  if (phase === "results" && result) {
    const { score, passed, correctCount, totalCount, timeTakenSeconds, passingThreshold } = result
    const weakModules = getWeakModules()
    const scoreDisplay = Math.round(score)

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Belt modal for pass */}
        {showBeltModal && (
          <BeltAwardModal
            mode="exam-passed"
            userId={userId}
            onClose={() => setShowBeltModal(false)}
          />
        )}

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Result card */}
          <div className={`rounded-2xl p-8 mb-6 text-center ${passed ? "bg-green-600" : "bg-[#1E3A5F]"}`}>
            {passed ? (
              <>
                <div className="text-5xl mb-3" aria-hidden>✅</div>
                <h1 className="text-2xl font-extrabold text-white mb-2">
                  Congratulations!
                </h1>
                <p className="text-white/80 text-sm mb-4">
                  You scored <span className="font-black text-white text-xl">{scoreDisplay}%</span> — Passed!
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3" aria-hidden>📚</div>
                <h1 className="text-2xl font-extrabold text-white mb-2">
                  Good effort!
                </h1>
                <p className="text-white/80 text-sm mb-4">
                  You scored <span className="font-black text-white text-xl">{scoreDisplay}%</span>
                  {" "}— You need {passingThreshold}% to pass
                </p>
              </>
            )}

            {/* Stats row */}
            <div className="flex justify-center gap-6 mt-2">
              <div className="text-center">
                <p className="text-white/50 text-xs">Correct</p>
                <p className="text-white font-bold">{correctCount} / {totalCount}</p>
              </div>
              {timeTakenSeconds !== null && (
                <div className="text-center">
                  <p className="text-white/50 text-xs">Time taken</p>
                  <p className="text-white font-bold">{formatTimeTaken(timeTakenSeconds)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Weak modules (failed only) */}
          {!passed && weakModules.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Top areas to review</h2>
              <div className="space-y-3">
                {weakModules.map(({ tag, incorrect, total }) => (
                  <div key={tag} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground truncate">{tag}</span>
                    <span className="text-xs font-medium text-red-600 flex-shrink-0">
                      {incorrect} / {total} incorrect
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encouraging message for fail */}
          {!passed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
              Great effort — keep practising and try again. You need {passingThreshold - scoreDisplay}% more
              to pass!
            </div>
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
              {apiError}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            {!passed && (
              <button
                onClick={handleRetake}
                className="w-full min-h-[52px] bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-bold text-sm rounded-xl transition-colors"
              >
                Try Again →
              </button>
            )}
            {passed && (
              <a
                href={`/certificate/${userId}`}
                className="w-full min-h-[52px] flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-[#1E3A5F] font-bold text-sm rounded-xl transition-colors"
              >
                View Certificate →
              </a>
            )}
            <a
              href={passed ? "/dashboard" : "/modules"}
              className="w-full min-h-[52px] flex items-center justify-center border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/5 font-semibold text-sm rounded-xl transition-colors"
            >
              {passed ? "Back to Dashboard" : "Back to Modules"}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // ── Render: Completing (auto-submit spinner) ───────────────────────────────
  // ---------------------------------------------------------------------------
  if (phase === "completing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-foreground/50">
          <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Submitting your exam…</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // ── Render: Question / Feedback ────────────────────────────────────────────
  // ---------------------------------------------------------------------------
  if (questions.length === 0) return null
  const currentQuestion = questions[currentIndex]
  const totalQ          = config?.totalQuestions ?? questions.length
  const isLastQuestion  = currentIndex >= questions.length - 1
  const isTimerWarning  = timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 300

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Fixed header bar ─────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#1E3A5F] text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Title */}
          <span className="text-sm font-bold hidden sm:inline flex-shrink-0">
            Black Belt Exam
          </span>
          <span className="text-sm font-bold sm:hidden flex-shrink-0">🥋 Exam</span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Question counter */}
          <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full flex-shrink-0">
            Q {currentIndex + 1} / {totalQ}
          </span>

          {/* Timer */}
          {config?.isTimed && timeRemaining !== null && (
            <span
              className={`text-sm font-mono font-bold px-3 py-1 rounded-full flex-shrink-0 tabular-nums ${
                isTimerWarning
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white/10 text-white"
              }`}
              aria-label={`Time remaining: ${formatTimer(timeRemaining)}`}
            >
              {formatTimer(timeRemaining)}
            </span>
          )}

          {/* Save & exit */}
          <button
            onClick={handleSaveExit}
            className="text-xs text-white/60 hover:text-white transition-colors flex-shrink-0 min-h-[36px] px-2"
          >
            Save & Exit
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-1 bg-[#F97316] transition-all duration-300"
            style={{ width: `${((currentIndex) / totalQ) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Timer warning banner ──────────────────────────────────────────── */}
      {isTimerWarning && (
        <div className="fixed top-[57px] left-0 right-0 z-30 bg-red-500 text-white text-center py-2 text-xs font-semibold">
          ⚠️ 5 minutes remaining — answer remaining questions quickly!
        </div>
      )}

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <main
        className={`max-w-2xl mx-auto w-full px-4 pb-10 ${
          isTimerWarning ? "pt-[88px]" : "pt-[72px]"
        }`}
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 mt-4">
            {apiError}
          </div>
        )}

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mt-4 mb-5">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${DIFFICULTY_BADGE[currentQuestion.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
              {currentQuestion.difficulty.charAt(0) + currentQuestion.difficulty.slice(1).toLowerCase()}
            </span>
            {currentQuestion.moduleTag && (
              <span className="text-xs text-foreground/40">
                From: {currentQuestion.moduleTag}
              </span>
            )}
          </div>

          {/* Question text */}
          <p className="text-base font-semibold text-foreground leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Answer options */}
        <div className="space-y-3 mb-5">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedId === opt.id
            const isSubmitted = phase === "feedback"

            // Colouring after submission
            let cardClass = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            if (isSubmitted && feedback) {
              if (opt.id === feedback.correctOptionId) {
                cardClass = "border-green-500 bg-green-50"
              } else if (isSelected && !feedback.isCorrect) {
                cardClass = "border-red-400 bg-red-50"
              } else {
                cardClass = "border-gray-200 bg-white opacity-60"
              }
            } else if (isSelected) {
              cardClass = "border-[#F97316] bg-[#F97316]/5 shadow-sm"
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isSubmitted}
                onClick={() => !isSubmitted && setSelectedId(opt.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 min-h-[56px] ${cardClass} ${
                  isSubmitted ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Radio / result indicator */}
                  <span
                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSubmitted && feedback
                        ? opt.id === feedback.correctOptionId
                          ? "border-green-500 bg-green-500"
                          : isSelected && !feedback.isCorrect
                          ? "border-red-400 bg-red-400"
                          : "border-gray-300 bg-white"
                        : isSelected
                        ? "border-[#F97316] bg-[#F97316]"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSubmitted && feedback && opt.id === feedback.correctOptionId && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {isSubmitted && feedback && isSelected && !feedback.isCorrect && opt.id !== feedback.correctOptionId && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {!isSubmitted && isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <p className={`text-sm leading-relaxed ${
                    isSubmitted && feedback && opt.id === feedback.correctOptionId
                      ? "text-green-800 font-medium"
                      : isSelected
                      ? "text-foreground font-medium"
                      : "text-foreground/80"
                  }`}>
                    {opt.optionText}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Explanation (shown after submit) */}
        {phase === "feedback" && feedback?.explanation && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              Explanation
            </p>
            <p className="text-blue-900 text-sm leading-relaxed">{feedback.explanation}</p>
          </div>
        )}

        {/* Correct / incorrect indicator (shown after submit) */}
        {phase === "feedback" && feedback && (
          <div className={`flex items-center gap-2 text-sm font-semibold mb-5 ${feedback.isCorrect ? "text-green-600" : "text-red-600"}`}>
            <span aria-hidden>{feedback.isCorrect ? "✓" : "✗"}</span>
            <span>{feedback.isCorrect ? "Correct!" : "Incorrect"}</span>
          </div>
        )}

        {/* Action buttons */}
        {phase === "question" && (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedId || submitting}
            className="w-full sm:w-auto min-h-[48px] bg-[#F97316] hover:bg-[#e06810] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm px-8 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Submitting…
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
        )}

        {phase === "feedback" && (
          <button
            onClick={handleNext}
            className="w-full sm:w-auto min-h-[48px] bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-bold text-sm px-8 rounded-xl transition-colors"
          >
            {isLastQuestion ? "Complete Exam →" : "Next Question →"}
          </button>
        )}
      </main>
    </div>
  )
}
