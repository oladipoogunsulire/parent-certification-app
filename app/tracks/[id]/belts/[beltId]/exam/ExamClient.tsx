"use client"

import { useState } from "react"

interface Option {
  id: string
  optionText: string
}

interface Question {
  id: string
  questionText: string
  questionType: string
  difficultyLevel: number
  options: Option[]
}

interface QuestionResult {
  questionId: string
  correct: boolean
  correctOptionIds: string[]
}

interface ExamResult {
  passed: boolean
  scorePercentage: number
  correctCount: number
  totalQuestions: number
  passingThreshold: number
  results: QuestionResult[]
}

interface Props {
  trackId: string
  beltId: string
  beltLevel: string
  questions: Question[]
}

export default function ExamClient({ trackId, beltId, beltLevel, questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ExamResult | null>(null)
  const [startTime] = useState(() => Date.now())

  const setAnswer = (questionId: string, optionId: string, questionType: string) => {
    if (result) return // locked after submission
    setAnswers((prev) => {
      if (questionType === "MULTI_SELECT") {
        const current = prev[questionId] ?? []
        const exists = current.includes(optionId)
        return {
          ...prev,
          [questionId]: exists
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        }
      }
      return { ...prev, [questionId]: [optionId] }
    })
  }

  const answeredCount = Object.keys(answers).filter(
    (qId) => (answers[qId]?.length ?? 0) > 0
  ).length

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      setError(`Please answer all ${questions.length} questions before submitting.`)
      return
    }
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/tracks/${trackId}/belts/${beltId}/exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
            questionId,
            selectedOptionIds,
          })),
          timeTakenSeconds: Math.round((Date.now() - startTime) / 1000),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong submitting the exam.")
        setSubmitting(false)
        return
      }

      setResult(data)
    } catch {
      setError("Something went wrong submitting the exam.")
    }
    setSubmitting(false)
  }

  // ── Results screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Score card */}
        <div
          className={`rounded-xl border-2 p-8 mb-8 text-center ${
            result.passed
              ? "border-green-300 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className="text-5xl font-bold mb-2" aria-label="Score">
            {result.scorePercentage}%
          </p>
          <p className={`text-xl font-semibold mb-1 ${result.passed ? "text-green-700" : "text-red-700"}`}>
            {result.passed ? `${beltLevel} Belt — Passed!` : "Not passed — try again"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {result.correctCount} / {result.totalQuestions} correct ·{" "}
            {result.passingThreshold}% required to pass
          </p>
          {result.passed && (
            <p className="text-sm text-green-700 mt-3 font-medium">
              Your belt has been earned. View it on your dashboard.
            </p>
          )}
        </div>

        {/* Per-question review */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review</h2>
        <div className="space-y-4 mb-8">
          {questions.map((q, idx) => {
            const qResult = result.results.find((r) => r.questionId === q.id)
            const selectedIds = answers[q.id] ?? []

            return (
              <div
                key={q.id}
                className={`rounded-lg border p-4 ${
                  qResult?.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className={`mt-0.5 text-sm font-bold ${qResult?.correct ? "text-green-600" : "text-red-600"}`}>
                    {qResult?.correct ? "✓" : "✗"}
                  </span>
                  <p className="text-sm font-medium text-gray-900">
                    {idx + 1}. {q.questionText}
                  </p>
                </div>
                <div className="space-y-1 ml-5">
                  {q.options.map((opt) => {
                    const isSelected = selectedIds.includes(opt.id)
                    const isCorrect = qResult?.correctOptionIds.includes(opt.id)
                    return (
                      <div
                        key={opt.id}
                        className={`text-sm px-3 py-1.5 rounded ${
                          isCorrect
                            ? "bg-green-100 text-green-800 font-medium"
                            : isSelected
                            ? "bg-red-100 text-red-800"
                            : "text-gray-600"
                        }`}
                      >
                        {isCorrect ? "✓ " : isSelected ? "✗ " : "  "}
                        {opt.optionText}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Go to dashboard
          </a>
          <a
            href={`/tracks/${trackId}`}
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Back to module
          </a>
        </div>
      </div>
    )
  }

  // ── Exam screen ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{answeredCount} of {questions.length} answered</span>
          <span>{questions.length} questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-6 text-sm">{error}</div>
      )}

      <div className="space-y-6 mb-8">
        {questions.map((q, idx) => {
          const selectedIds = answers[q.id] ?? []
          const isMulti = q.questionType === "MULTI_SELECT"

          return (
            <div key={q.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-2 mb-4">
                <span className="text-xs font-bold text-gray-400 mt-0.5 w-6 shrink-0">
                  {idx + 1}.
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                  {isMulti && (
                    <p className="text-xs text-gray-400 mt-1">Select all that apply</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 ml-8">
                {q.options.map((opt) => {
                  const selected = selectedIds.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer(q.id, opt.id, q.questionType)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className={`inline-block w-4 h-4 mr-2 rounded-${isMulti ? "sm" : "full"} border-2 align-text-bottom ${
                        selected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                      }`} />
                      {opt.optionText}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <a
          href={`/tracks/${trackId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel exam
        </a>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit exam"}
        </button>
      </div>
    </div>
  )
}
