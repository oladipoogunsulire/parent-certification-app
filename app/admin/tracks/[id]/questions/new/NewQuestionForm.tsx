"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Belt {
  id: string
  beltLevel: string
}

interface OptionField {
  optionText: string
  isCorrect: boolean
  explanationText: string
}

const emptyOption = (): OptionField => ({
  optionText: "",
  isCorrect: false,
  explanationText: "",
})

export default function NewQuestionForm({
  trackId,
  belts,
}: {
  trackId: string
  belts: Belt[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    beltId: belts[0]?.id ?? "",
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    difficultyLevel: 1,
  })

  const [options, setOptions] = useState<OptionField[]>([
    emptyOption(),
    emptyOption(),
    emptyOption(),
    emptyOption(),
  ])

  const updateOption = (
    index: number,
    field: keyof OptionField,
    value: string | boolean
  ) => {
    setOptions((prev) =>
      prev.map((o, i) => {
        if (i !== index) {
          // For MULTIPLE_CHOICE, uncheck other options when one is checked
          if (field === "isCorrect" && value === true && form.questionType === "MULTIPLE_CHOICE") {
            return { ...o, isCorrect: false }
          }
          return o
        }
        return { ...o, [field]: value }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        setLoading(false)
        return
      }

      router.push(`/admin/tracks/${trackId}`)
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  const isMultiSelect = form.questionType === "MULTI_SELECT"

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a
          href={`/admin/tracks/${trackId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to track
        </a>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Add question</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Question details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Belt level <span className="text-red-500">*</span>
              </label>
              <select
                value={form.beltId}
                onChange={(e) => setForm({ ...form, beltId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {belts.map((belt) => (
                  <option key={belt.id} value={belt.id}>
                    {belt.beltLevel} Belt
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question type
              </label>
              <select
                value={form.questionType}
                onChange={(e) => setForm({ ...form, questionType: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MULTIPLE_CHOICE">Multiple choice (one answer)</option>
                <option value="MULTI_SELECT">Multi-select (multiple answers)</option>
                <option value="SCENARIO_INTEGRATED">Scenario integrated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty level
            </label>
            <select
              value={form.difficultyLevel}
              onChange={(e) =>
                setForm({ ...form, difficultyLevel: parseInt(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 — Foundational</option>
              <option value={2}>2 — Intermediate</option>
              <option value={3}>3 — Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g. What is the most effective response when a child refuses to follow a boundary?"
              required
            />
          </div>
        </div>

        {/* Answer options */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Answer options</h3>
          <p className="text-xs text-gray-500 mb-4">
            {isMultiSelect
              ? "Check all correct answers. Blank options will be skipped."
              : "Check exactly one correct answer. Blank options will be skipped."}
          </p>

          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center pt-2">
                    <input
                      id={`correct-${index}`}
                      type={isMultiSelect ? "checkbox" : "radio"}
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={(e) =>
                        updateOption(index, "isCorrect", e.target.checked)
                      }
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Option {index + 1}
                        {option.isCorrect && (
                          <span className="ml-2 text-green-600">✓ Correct</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={option.optionText}
                        onChange={(e) =>
                          updateOption(index, "optionText", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Answer option ${index + 1}...`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Explanation (shown after answer)
                      </label>
                      <input
                        type="text"
                        value={option.explanationText}
                        onChange={(e) =>
                          updateOption(index, "explanationText", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Why is this right or wrong?"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save question"}
          </button>
          <a
            href={`/admin/tracks/${trackId}`}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
