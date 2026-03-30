"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"

export default function NewLessonPage() {
  const router = useRouter()
  const params = useParams()
  const trackId = params.id as string
  const moduleId = params.moduleId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    lessonTitle: "",
    contentBody: "",
    reflectionPrompt: "",
    estimatedDurationMinutes: 10,
    xpValue: 20,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/modules/${moduleId}/lessons`, {
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

      router.push(`/admin/tracks/${trackId}/modules/${moduleId}`)
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a href={`/admin/tracks/${trackId}/modules/${moduleId}`} className="text-sm text-blue-600 hover:underline">
          Back to module
        </a>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Add lesson</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lesson title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.lessonTitle}
            onChange={(e) => setForm({ ...form, lessonTitle: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. What Are Boundaries and Why Do They Matter?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lesson content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.contentBody}
            onChange={(e) => setForm({ ...form, contentBody: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows={12}
            placeholder="Write the full lesson content here..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">Write in plain text. Formatting support coming soon.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reflection prompt (optional)
          </label>
          <textarea
            value={form.reflectionPrompt}
            onChange={(e) => setForm({ ...form, reflectionPrompt: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="e.g. What would you instinctively do when your child refuses a boundary?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated duration (minutes)
            </label>
            <input
              type="number"
              value={form.estimatedDurationMinutes}
              onChange={(e) => setForm({ ...form, estimatedDurationMinutes: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
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
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save lesson"}
          </button>
          <a href={`/admin/tracks/${trackId}/modules/${moduleId}`} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}