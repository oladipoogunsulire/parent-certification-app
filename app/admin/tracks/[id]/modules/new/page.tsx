"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function NewModulePage() {
  const router = useRouter()
  const params = useParams()
  const trackId = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [belts, setBelts] = useState<{ id: string; beltLevel: string; orderIndex: number }[]>([])
  const [form, setForm] = useState({
    moduleTitle: "",
    description: "",
    beltId: "",
    isRequired: true,
    isFreePreview: false,
    xpValue: 50,
  })

  useEffect(() => {
    fetch(`/api/admin/tracks/${trackId}/belts`)
      .then((res) => res.json())
      .then((data) => setBelts(data))
  }, [trackId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href={`/admin/tracks/${trackId}`} className="text-sm text-blue-600 hover:underline">
          Back to track
        </a>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Add module</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.moduleTitle}
            onChange={(e) => setForm({ ...form, moduleTitle: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Understanding Boundaries"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="What will parents learn in this module?"
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
            <option value="">Select belt</option>
            {belts.map((belt) => (
              <option key={belt.id} value={belt.id}>
                {belt.beltLevel} Belt
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            XP value
          </label>
          <input
            type="number"
            value={form.xpValue}
            onChange={(e) => setForm({ ...form, xpValue: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
              className="rounded"
            />
            Required for belt
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isFreePreview}
              onChange={(e) => setForm({ ...form, isFreePreview: e.target.checked })}
              className="rounded"
            />
            Free preview (no subscription needed)
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create module"}
          </button>
          <a href={`/admin/tracks/${trackId}`} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}