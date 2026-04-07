"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  trackId: string
  initial: {
    trackName: string
    description: string
    ageBand: string
    curriculumVersion: string
    expiryDurationMonths: number
    renewalModelType: string
    isActive: boolean
  }
}

export default function EditTrackForm({ trackId, initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(initial)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      // Brief pause so the user sees the success message, then redirect
      setTimeout(() => router.push("/admin/tracks"), 800)
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/admin/tracks" className="text-sm text-[#1E3A5F] hover:underline">
          ← Back to modules
        </a>
        <h2 className="text-2xl font-bold text-[#1E3A5F] mt-2">Edit module</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
          Module updated successfully. Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        {/* Track name */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">
            Module name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.trackName}
            onChange={(e) => setForm({ ...form, trackName: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
            placeholder="e.g. Ages 5–9: Structure & Boundary Formation"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
            rows={3}
            placeholder="Brief description of this module..."
          />
        </div>

        {/* Age band */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">
            Age band
          </label>
          <select
            value={form.ageBand}
            onChange={(e) => setForm({ ...form, ageBand: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
          >
            <option value="">Select age band</option>
            <option value="0–4">0–4: Attachment &amp; Emotional Foundations</option>
            <option value="5–9">5–9: Structure &amp; Boundary Formation</option>
            <option value="10–13">10–13: Identity Formation &amp; Social Complexity</option>
            <option value="14–18">14–18: Autonomy &amp; Conflict Navigation</option>
          </select>
        </div>

        {/* Curriculum version + expiry side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">
              Curriculum version
            </label>
            <input
              type="text"
              value={form.curriculumVersion}
              onChange={(e) => setForm({ ...form, curriculumVersion: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
              placeholder="1.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">
              Black Belt expiry (months)
            </label>
            <input
              type="number"
              value={form.expiryDurationMonths}
              onChange={(e) =>
                setForm({ ...form, expiryDurationMonths: parseInt(e.target.value) || 12 })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
              min={1}
              max={60}
            />
          </div>
        </div>

        {/* Renewal model */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1">
            Renewal model
          </label>
          <select
            value={form.renewalModelType}
            onChange={(e) => setForm({ ...form, renewalModelType: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
          >
            <option value="EXAM_ONLY">Exam only</option>
            <option value="CE_ONLY">Continuing education only</option>
            <option value="HYBRID">Hybrid (exam + CE)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            How Black Belt holders renew their certification
          </p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3 pt-1">
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
          <span className="text-sm font-medium text-[#1E293B]">
            {form.isActive ? "Active (visible to learners)" : "Inactive (hidden from learners)"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading || success}
            className="bg-[#1E3A5F] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
          <a
            href="/admin/tracks"
            className="border border-gray-300 text-[#1E293B] px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
