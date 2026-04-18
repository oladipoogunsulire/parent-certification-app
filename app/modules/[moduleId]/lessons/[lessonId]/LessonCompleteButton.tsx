"use client"

import { useState, useTransition } from "react"
import { updateLessonProgress } from "@/app/actions/update-lesson-progress"
import BeltAwardModal from "@/app/components/BeltAwardModal"

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
  const [completed, setCompleted]   = useState(initialCompleted)
  const [isPending, startTransition] = useTransition()
  const [beltModal, setBeltModal]   = useState<string | null>(null)
  const [showModuleComplete, setShowModuleComplete] = useState(false)

  const navigateTo = nextLessonHref ?? moduleHref

  function handleComplete() {
    startTransition(async () => {
      const result = await updateLessonProgress(lessonId, true)
      setCompleted(true)

      if (result?.beltUpdate?.beltChanged && result.beltUpdate.newBelt) {
        // Belt upgrade — show belt-earned modal
        setBeltModal(result.beltUpdate.newBelt)
      } else if (result?.beltUpdate?.allModulesComplete) {
        // All 10 modules done — show exam unlock modal
        setShowModuleComplete(true)
      } else {
        // Short delay so the "✅ Completed" flash is visible before navigating
        setTimeout(() => {
          window.location.href = navigateTo
        }, 600)
      }
    })
  }

  return (
    <>
      {/* All-modules-complete modal */}
      {showModuleComplete && (
        <BeltAwardModal
          mode="module-complete"
          onClose={() => {
            setShowModuleComplete(false)
            window.location.href = navigateTo
          }}
        />
      )}

      {/* Belt-earned modal */}
      {beltModal && (
        <BeltAwardModal
          mode="belt-earned"
          beltName={beltModal}
          onClose={() => {
            setBeltModal(null)
            window.location.href = navigateTo
          }}
        />
      )}

      {completed && !beltModal && !showModuleComplete ? (
        <div className="flex items-center gap-2 text-green-600 font-semibold text-sm min-h-[44px]">
          <span aria-hidden>✅</span>
          <span>Completed</span>
        </div>
      ) : !completed ? (
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="min-h-[44px] bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Mark as Complete"}
        </button>
      ) : null}
    </>
  )
}
