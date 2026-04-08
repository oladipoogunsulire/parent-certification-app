"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getEmbedUrl } from "@/lib/video"

interface Props {
  trackId: string
  moduleId: string
  initial: {
    moduleTitle: string
    description: string
    introVideoUrl: string
  }
}

export default function EditModuleForm({ trackId, moduleId, initial }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
      const res = await fetch(
        `/api/admin/tracks/${trackId}/modules/${moduleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      router.refresh()
    } catch {
      setError("Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">Module settings</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="border-t border-gray-100 px-6 pb-6 pt-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded text-sm mb-4">
              Module settings saved.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.moduleTitle}
                onChange={(e) => setForm({ ...form, moduleTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Module intro video URL (optional)
              </label>
              <input
                type="url"
                value={form.introVideoUrl}
                onChange={(e) => setForm({ ...form, introVideoUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste YouTube, Vimeo or Synthesia link"
              />
              <p className="text-xs text-gray-500 mt-1">
                This video plays when a user enters the module. Supports YouTube, Vimeo and Synthesia links.
              </p>
              {getEmbedUrl(form.introVideoUrl) && (
                <div
                  className="mt-2 relative w-full rounded overflow-hidden bg-black"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    src={getEmbedUrl(form.introVideoUrl)!}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Module intro video preview"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#1E3A5F] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving…" : "Save settings"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setSuccess(false); setError("") }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
