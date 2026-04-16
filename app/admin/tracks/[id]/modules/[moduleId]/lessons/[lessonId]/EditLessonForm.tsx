"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getEmbedUrl } from "@/lib/video"

interface ResourceItem {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

interface Props {
  trackId: string
  moduleId: string
  lessonId: string
  initial: {
    lessonTitle: string
    introVideoUrl: string
    mainVideoUrl: string
    contentBody: string
    reflectionPrompt: string
    estimatedDurationMinutes: number
    xpValue: number
  }
  initialResources: ResourceItem[]
}

export default function EditLessonForm({ trackId, moduleId, lessonId, initial, initialResources }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(initial)

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>(initialResources)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError("")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/resources`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || "Upload failed")
      } else {
        setResources((prev) => [...prev, { ...data, uploadedAt: data.uploadedAt ?? new Date().toISOString() }])
      }
    } catch {
      setUploadError("Upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    setDeletingId(resourceId)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/resources/${resourceId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== resourceId))
      }
    } finally {
      setDeletingId(null)
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(
        `/api/admin/tracks/${trackId}/modules/${moduleId}/lessons/${lessonId}`,
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
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Edit lesson</h2>
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
            required
          />
        </div>

        {/* Intro video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intro video URL (optional)
          </label>
          <input
            type="url"
            value={form.introVideoUrl}
            onChange={(e) => setForm({ ...form, introVideoUrl: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste YouTube, Vimeo or Synthesia link"
          />
          <p className="text-xs text-gray-500 mt-1">Supports YouTube, Vimeo and Synthesia links</p>
          {getEmbedUrl(form.introVideoUrl) && (
            <div className="mt-2 relative w-full rounded overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={getEmbedUrl(form.introVideoUrl)!}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Intro video preview"
              />
            </div>
          )}
        </div>

        {/* Main video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main lesson video URL (optional)
          </label>
          <input
            type="url"
            value={form.mainVideoUrl}
            onChange={(e) => setForm({ ...form, mainVideoUrl: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste YouTube, Vimeo or Synthesia link"
          />
          <p className="text-xs text-gray-500 mt-1">Supports YouTube, Vimeo and Synthesia links</p>
          {getEmbedUrl(form.mainVideoUrl) && (
            <div className="mt-2 relative w-full rounded overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={getEmbedUrl(form.mainVideoUrl)!}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Main video preview"
              />
            </div>
          )}
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
            required
          />
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
              onChange={(e) =>
                setForm({ ...form, estimatedDurationMinutes: parseInt(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">XP value</label>
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

      {/* ── Resources section ──────────────────────────────────── */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Downloadable resources</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {resources.length}/5 resources · PDF, PNG, JPG, GIF, DOCX · max 10 MB each
            </p>
          </div>
          {resources.length < 5 && (
            <label className="cursor-pointer">
              <span className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                {uploading ? "Uploading…" : "Upload file"}
              </span>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {uploadError && (
          <p className="text-red-600 text-sm mb-3">{uploadError}</p>
        )}

        {resources.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No resources yet</p>
        ) : (
          <ul className="space-y-2">
            {resources.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.fileName}</p>
                  <p className="text-xs text-gray-400">{formatBytes(r.fileSize)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteResource(r.id)}
                  disabled={deletingId === r.id}
                  className="ml-4 flex-shrink-0 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deletingId === r.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
