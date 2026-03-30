"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewTrackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    trackName: "",
    description: "",
    ageBand: "",
    expiryDurationMonths: 12,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/tracks", {
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

      router.push(`/admin/tracks/${data.id}`)
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/admin/tracks" className="text-sm text-blue-600 hover:underline">
          Back to tracks
        </a>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Create track</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.trackName}
            onChange={(e) => setForm({ ...form, trackName: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Ages 5–9: Structure & Boundary Formation"
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
            rows={3}
            placeholder="Brief description of this track..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age band
          </label>
          <select
            value={form.ageBand}
            onChange={(e) => setForm({ ...form, ageBand: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select age band</option>
            <option value="0–4">0–4: Attachment & Emotional Foundations</option>
            <option value="5–9">5–9: Structure & Boundary Formation</option>
            <option value="10–13">10–13: Identity Formation & Social Complexity</option>
            <option value="14–18">14–18: Autonomy & Conflict Navigation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Black Belt expiry (months)
          </label>
          <input
            type="number"
            value={form.expiryDurationMonths}
            onChange={(e) => setForm({ ...form, expiryDurationMonths: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={1}
            max={60}
          />
          <p className="text-xs text-gray-500 mt-1">How long before Black Belt certification expires and requires renewal</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create track"}
          </button>
          
<a href="/admin/tracks" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
  Cancel
</a>        </div>
      </form>
    </div>
  )
}