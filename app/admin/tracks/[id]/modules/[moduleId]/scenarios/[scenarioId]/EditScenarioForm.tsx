"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getEmbedUrl } from "@/lib/video"

interface Belt {
  id: string
  beltLevel: string
}

interface ResponseField {
  responseText: string
  isOptimal: boolean
  scoreImpact: number
  explanationText: string
}

interface Props {
  trackId: string
  moduleId: string
  scenarioId: string
  belts: Belt[]
  initial: {
    beltId: string
    scenarioTitle: string
    videoUrl: string
    narrativeText: string
    complexityLevel: number
    xpValue: number
    isRequired: boolean
    isActive: boolean
    responses: ResponseField[]
  }
}

const SCORE_OPTIONS = [
  { value: 10, label: "10 — Best response (Most influential)" },
  { value: 7,  label: "7 — Good response (Positively influential)" },
  { value: 5,  label: "5 — Neutral response (Minimally influential)" },
  { value: 3,  label: "3 — Weak response (Least influential)" },
]

const SCORING_GUIDE = [
  { score: 10, label: "Best response",    description: "The most influential parenting choice — assign to one response only" },
  { score: 7,  label: "Good response",    description: "A positive choice with meaningful influence" },
  { score: 5,  label: "Neutral response", description: "Minimally influential — neither harmful nor helpful" },
  { score: 3,  label: "Weak response",    description: "The least influential choice — assign to the weakest response" },
]

const emptyResponse = (): ResponseField => ({
  responseText: "",
  isOptimal: false,
  scoreImpact: 3,
  explanationText: "",
})

export default function EditScenarioForm({
  trackId,
  moduleId,
  scenarioId,
  belts,
  initial,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [guideOpen, setGuideOpen] = useState(false)

  const [form, setForm] = useState({
    beltId: initial.beltId,
    scenarioTitle: initial.scenarioTitle,
    videoUrl: initial.videoUrl,
    narrativeText: initial.narrativeText,
    complexityLevel: initial.complexityLevel,
    xpValue: initial.xpValue,
    isRequired: initial.isRequired,
    isActive: initial.isActive,
  })

  // Pre-populate from DB; ensure minimum 2 slots
  const [responses, setResponses] = useState<ResponseField[]>(() => {
    const loaded = initial.responses.length > 0 ? [...initial.responses] : []
    while (loaded.length < 2) loaded.push(emptyResponse())
    return loaded
  })

  const updateResponse = (
    index: number,
    field: keyof ResponseField,
    value: string | boolean | number
  ) => {
    setResponses((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
  }

  const addResponse = () => {
    if (responses.length < 6) {
      setResponses((prev) => [...prev, emptyResponse()])
    }
  }

  const removeResponse = (index: number) => {
    if (responses.length > 2) {
      setResponses((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const validate = (): string[] => {
    const errors: string[] = []
    const filled = responses.filter((r) => r.responseText.trim() !== "")
    if (filled.length < 2) {
      errors.push("At least 2 responses must be filled in.")
    }
    const optimalCount = filled.filter((r) => r.isOptimal).length
    if (optimalCount !== 1) {
      errors.push("Exactly one response must be marked as the optimal response.")
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const errors = validate()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    setLoading(true)

    try {
      const res = await fetch(
        `/api/admin/tracks/${trackId}/modules/${moduleId}/scenarios/${scenarioId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, responses }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        setLoading(false)
        return
      }

      router.push(`/admin/tracks/${trackId}/modules/${moduleId}`)
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a
          href={`/admin/tracks/${trackId}/modules/${moduleId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to module
        </a>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Edit scenario</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scenario details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Scenario details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.scenarioTitle}
              onChange={(e) => setForm({ ...form, scenarioTitle: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. The Bedtime Refusal"
              required
            />
          </div>

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
              Scenario video URL (optional)
            </label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste YouTube, Vimeo or Synthesia link"
            />
            <p className="text-xs text-gray-500 mt-1">Supports YouTube, Vimeo and Synthesia links</p>
            {getEmbedUrl(form.videoUrl) && (
              <div className="mt-2 relative w-full rounded overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={getEmbedUrl(form.videoUrl)!}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Scenario video preview"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Narrative text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.narrativeText}
              onChange={(e) => setForm({ ...form, narrativeText: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complexity level (1–5)
              </label>
              <input
                type="number"
                value={form.complexityLevel}
                onChange={(e) =>
                  setForm({ ...form, complexityLevel: parseInt(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                max={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                XP value
              </label>
              <input
                type="number"
                value={form.xpValue}
                onChange={(e) =>
                  setForm({ ...form, xpValue: parseInt(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isRequired"
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">
              Required for belt progression
            </label>
          </div>
        </div>

        {/* Response options */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Response options</h3>

          {/* Influence Score™ Scoring Guide */}
          <div className="mb-5 rounded-lg border border-[#1E3A5F]/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setGuideOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors"
            >
              <span>Influence Score™ Scoring Guide</span>
              <svg
                className={`w-4 h-4 transition-transform ${guideOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {guideOpen && (
              <div className="border-t border-[#1E3A5F]/20">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1E3A5F]/5">
                      <th className="text-left px-4 py-2 font-semibold text-[#1E3A5F] w-12">Score</th>
                      <th className="text-left px-4 py-2 font-semibold text-[#1E3A5F] w-36">Label</th>
                      <th className="text-left px-4 py-2 font-semibold text-[#1E3A5F]">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCORING_GUIDE.map((row) => (
                      <tr key={row.score} className="border-t border-gray-100">
                        <td className="px-4 py-2 font-bold text-[#F97316]">{row.score}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{row.label}</td>
                        <td className="px-4 py-2 text-gray-600">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {validationErrors.map((err, i) => (
                <p key={i} className="text-sm text-red-700">{err}</p>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 mb-4">
            Add 2–6 response options. Blank responses will be removed on save. Exactly one must be marked optimal.
          </p>

          <div className="space-y-4">
            {responses.map((response, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      Response {index + 1}
                    </p>
                    {response.scoreImpact === 10 && response.responseText.trim() !== "" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Best response
                      </span>
                    )}
                  </div>
                  {responses.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeResponse(index)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Response text
                    </label>
                    <textarea
                      value={response.responseText}
                      onChange={(e) =>
                        updateResponse(index, "responseText", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="What the parent might say or do..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Influence Score™
                      </label>
                      <select
                        value={response.scoreImpact}
                        onChange={(e) =>
                          updateResponse(index, "scoreImpact", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {SCORE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <div className="flex items-center gap-2">
                        <input
                          id={`optimal-edit-${index}`}
                          type="checkbox"
                          checked={response.isOptimal}
                          onChange={(e) =>
                            updateResponse(index, "isOptimal", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`optimal-edit-${index}`}
                          className="text-sm font-medium text-gray-700"
                        >
                          Optimal response
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Explanation (shown after selection)
                    </label>
                    <textarea
                      value={response.explanationText}
                      onChange={(e) =>
                        updateResponse(index, "explanationText", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Why this response is or isn't optimal..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {responses.length < 6 && (
            <button
              type="button"
              onClick={addResponse}
              className="mt-4 flex items-center gap-1.5 text-sm text-[#1E3A5F] font-medium hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add response
            </button>
          )}
        </div>

        {/* Active toggle */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Visibility</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] ${
                form.isActive ? "bg-[#1E3A5F]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              Active (visible to learners)
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
          <a
            href={`/admin/tracks/${trackId}/modules/${moduleId}`}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
