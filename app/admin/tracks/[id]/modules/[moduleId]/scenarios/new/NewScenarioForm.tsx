"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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

const emptyResponse = (): ResponseField => ({
  responseText: "",
  isOptimal: false,
  scoreImpact: 0,
  explanationText: "",
})

export default function NewScenarioForm({
  trackId,
  moduleId,
  belts,
}: {
  trackId: string
  moduleId: string
  belts: Belt[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    beltId: belts[0]?.id ?? "",
    narrativeText: "",
    complexityLevel: 1,
    xpValue: 30,
    isRequired: true,
  })

  const [responses, setResponses] = useState<ResponseField[]>([
    emptyResponse(),
    emptyResponse(),
    emptyResponse(),
    emptyResponse(),
  ])

  const updateResponse = (index: number, field: keyof ResponseField, value: string | boolean | number) => {
    setResponses((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(
        `/api/admin/tracks/${trackId}/modules/${moduleId}/scenarios`,
        {
          method: "POST",
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
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Add scenario</h2>
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
              Narrative text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.narrativeText}
              onChange={(e) => setForm({ ...form, narrativeText: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="Describe the parenting scenario the learner must respond to..."
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
          <p className="text-xs text-gray-500 mb-4">
            Add up to 4 response options. Blank responses will be skipped.
          </p>

          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Response {index + 1}
                </p>

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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Score impact
                      </label>
                      <input
                        type="number"
                        value={response.scoreImpact}
                        onChange={(e) =>
                          updateResponse(index, "scoreImpact", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step={0.1}
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          id={`optimal-${index}`}
                          type="checkbox"
                          checked={response.isOptimal}
                          onChange={(e) =>
                            updateResponse(index, "isOptimal", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`optimal-${index}`}
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
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save scenario"}
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
