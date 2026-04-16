"use client"

import { useState } from "react"

interface Props {
  lessonId: string
  resourceId: string
  fileName: string
  fileSize: number
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DownloadButton({ lessonId, resourceId, fileName, fileSize }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Navigate to the download route — it will redirect to the pre-signed URL
      window.location.href = `/api/lessons/${lessonId}/resources/${resourceId}/download`
    } finally {
      // Give enough time for the browser to start the download before re-enabling
      setTimeout(() => setLoading(false), 2000)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 hover:border-accent/40 hover:bg-accent/5 transition-colors group disabled:opacity-50"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* File icon */}
        <div className="w-8 h-8 flex-shrink-0 rounded bg-accent/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
          <p className="text-xs text-foreground/40">{formatBytes(fileSize)}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">
        {loading ? (
          <svg className="w-4 h-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-foreground/30 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </div>
    </button>
  )
}
