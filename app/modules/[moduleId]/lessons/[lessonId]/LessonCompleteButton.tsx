"use client"

import { useState, useTransition } from "react"
import { updateLessonProgress } from "@/app/actions/update-lesson-progress"

interface Props {
  lessonId: string
  /** href for the next lesson, or null if this is the last lesson */
  nextLessonHref: string | null
  /** href for the module page — used after the last lesson */
  moduleHref: string
  /** whether this lesson is already marked complete */
  initialCompleted: boolean
}

export default function LessonCompleteButton({
  lessonId,
  nextLessonHref,
  moduleHref,
  initialCompleted,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      await updateLessonProgress(lessonId, true)
      setCompleted(true)
      // Short delay so the "✅ Completed" flash is visible before navigating
      setTimeout(() => {
        window.location.href = nextLessonHref ?? moduleHref
      }, 600)
    })
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-semibold text-sm min-h-[44px]">
        <span aria-hidden>✅</span>
        <span>Completed</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleComplete}
      disabled={isPending}
      className="min-h-[44px] bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
    >
      {isPending ? "Saving…" : "Mark as Complete"}
    </button>
  )
}
