"use client"

import { useState } from "react"

export interface ExamConfigData {
  id: string
  isEnabled: boolean
  passingThreshold: number
  totalQuestions: number
  isTimed: boolean
  timeLimitMinutes: number
  easyPercent: number
  mediumPercent: number
  hardPercent: number
  randomiseQuestions: boolean
  randomiseOptions: boolean
  certificateSignatory: string
}

interface QuestionCounts {
  easy: number
  medium: number
  hard: number
}

interface Props {
  initial: ExamConfigData
  questionCounts: QuestionCounts
}

function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  id: string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] ${
          checked ? "bg-[#1E3A5F]" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer">
        {label}
      </label>
    </div>
  )
}

export default function ExamSettingsForm({ initial, questionCounts }: Props) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  const diffSum = form.easyPercent + form.mediumPercent + form.hardPercent
  const diffValid = diffSum === 100

  const requiredEasy = Math.round((form.totalQuestions * form.easyPercent) / 100)
  const requiredHard = Math.round((form.totalQuestions * form.hardPercent) / 100)
  const requiredMedium = form.totalQuestions - requiredEasy - requiredHard

  const easyOk = questionCounts.easy >= requiredEasy
  const mediumOk = questionCounts.medium >= requiredMedium
  const hardOk = questionCounts.hard >= requiredHard

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diffValid) return
    setLoading(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch("/api/admin/exam/configuration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to save")
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium">
          ✓ Settings saved
        </div>
      )}

      {/* Exam enabled */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Availability
        </h3>
        <Toggle
          id="isEnabled"
          checked={form.isEnabled}
          onChange={(v) => setForm({ ...form, isEnabled: v })}
          label="Enable Black Belt Exam (make accessible to eligible users)"
        />
      </div>

      {/* Core settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Exam settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passing threshold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.passingThreshold}
                onChange={(e) =>
                  setForm({ ...form, passingThreshold: Number(e.target.value) })
                }
                min={1}
                max={100}
                className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total questions per attempt
            </label>
            <input
              type="number"
              value={form.totalQuestions}
              onChange={(e) =>
                setForm({ ...form, totalQuestions: Number(e.target.value) })
              }
              min={10}
              max={100}
              className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Toggle
            id="isTimed"
            checked={form.isTimed}
            onChange={(v) => setForm({ ...form, isTimed: v })}
            label="Timed exam"
          />
          {form.isTimed && (
            <div className="ml-14 flex items-center gap-2">
              <input
                type="number"
                value={form.timeLimitMinutes}
                onChange={(e) =>
                  setForm({ ...form, timeLimitMinutes: Number(e.target.value) })
                }
                min={5}
                max={180}
                className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Toggle
            id="randomiseQuestions"
            checked={form.randomiseQuestions}
            onChange={(v) => setForm({ ...form, randomiseQuestions: v })}
            label="Randomise question order"
          />
          <Toggle
            id="randomiseOptions"
            checked={form.randomiseOptions}
            onChange={(v) => setForm({ ...form, randomiseOptions: v })}
            label="Randomise answer option order"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certificate signatory <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.certificateSignatory}
            onChange={(e) =>
              setForm({ ...form, certificateSignatory: e.target.value })
            }
            className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            required
          />
        </div>
      </div>

      {/* Difficulty composition */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Difficulty composition
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {(
            [
              { key: "easyPercent", label: "Easy", color: "text-green-600" },
              { key: "mediumPercent", label: "Medium", color: "text-amber-600" },
              { key: "hardPercent", label: "Hard", color: "text-red-600" },
            ] as const
          ).map(({ key, label, color }) => (
            <div key={key}>
              <label className={`block text-sm font-medium mb-1 ${color}`}>
                {label} %
              </label>
              <input
                type="number"
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: Number(e.target.value) })
                }
                min={0}
                max={100}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
            </div>
          ))}
        </div>

        {!diffValid && (
          <p className="text-sm text-red-600 font-medium">
            Difficulty percentages must add up to 100% (currently {diffSum}%)
          </p>
        )}
        {diffValid && (
          <p className="text-sm text-green-600 font-medium">✓ Percentages add up to 100%</p>
        )}
      </div>

      {/* Availability warning */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Question bank availability
        </h3>
        <div className="space-y-3">
          {(
            [
              { label: "Easy", required: requiredEasy, have: questionCounts.easy, ok: easyOk },
              { label: "Medium", required: requiredMedium, have: questionCounts.medium, ok: mediumOk },
              { label: "Hard", required: requiredHard, have: questionCounts.hard, ok: hardOk },
            ] as const
          ).map(({ label, required, have, ok }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Need {required} · Have {have}
                </span>
                {ok ? (
                  <span className="text-green-600 font-semibold text-sm">✓ sufficient</span>
                ) : (
                  <span className="text-amber-600 font-semibold text-sm">⚠ insufficient</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !diffValid}
          className="bg-[#1E3A5F] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  )
}
