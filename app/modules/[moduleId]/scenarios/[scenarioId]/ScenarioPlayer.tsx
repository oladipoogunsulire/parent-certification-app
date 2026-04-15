"use client"

import { useState } from "react"
import VideoPlayer from "@/app/components/VideoPlayer"
import BeltAwardModal from "@/app/components/BeltAwardModal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScenarioData {
  id: string
  scenarioTitle: string | null
  videoUrl: string | null
  narrativeText: string
  xpValue: number
}

interface ResponseData {
  id: string
  responseText: string
  isOptimal: boolean
  scoreImpact: number
  explanationText: string | null
}

interface BeltUpdate {
  beltChanged: boolean
  newBelt: string | null
  previousBelt: string | null
}

interface AttemptResult {
  attempt: { id: string; attemptNumber: number; scoreEarned: number }
  selectedResponse: ResponseData
  influenceProfile: {
    influenceScore: number
    influenceLevel: string
    totalAttempts: number
  }
  isRetake: boolean
  beltUpdate: BeltUpdate
}

interface Props {
  scenario: ScenarioData
  responses: ResponseData[]
  moduleId: string
  moduleName: string
  priorAttemptCount: number
  currentInfluenceScore: number
  currentInfluenceLevel: string
  hasEverScored: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCORE_META: Record<number, { label: string; color: string }> = {
  10: { label: "Best",    color: "bg-green-100 text-green-800 border-green-200" },
  7:  { label: "Good",    color: "bg-blue-100 text-blue-800 border-blue-200" },
  5:  { label: "Neutral", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  3:  { label: "Weak",    color: "bg-gray-100 text-gray-600 border-gray-200" },
}

function scoreMeta(score: number) {
  return SCORE_META[score] ?? { label: String(score), color: "bg-gray-100 text-gray-600 border-gray-200" }
}

function levelStyle(level: string): { badge: string; text: string } {
  if (level === "Ultimate Influencer™")
    return { badge: "bg-[#1E3A5F] text-yellow-300 border-[#1E3A5F]", text: "text-[#1E3A5F]" }
  if (level === "Intentional Parent")
    return { badge: "bg-orange-100 text-[#F97316] border-orange-200", text: "text-[#F97316]" }
  if (level === "Developing Parent")
    return { badge: "bg-blue-100 text-blue-700 border-blue-200", text: "text-blue-700" }
  return { badge: "bg-gray-100 text-gray-600 border-gray-200", text: "text-gray-600" }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScenarioPlayer({
  scenario,
  responses,
  moduleId,
  moduleName,
  priorAttemptCount,
  currentInfluenceScore,
  currentInfluenceLevel,
  hasEverScored,
}: Props) {
  const [selectedId, setSelectedId]             = useState<string | null>(null)
  const [submitting, setSubmitting]              = useState(false)
  const [apiError, setApiError]                  = useState<string | null>(null)
  const [result, setResult]                      = useState<AttemptResult | null>(null)
  const [showBestResponse, setShowBestResponse]  = useState(false)
  const [showBeltModal, setShowBeltModal]        = useState(false)

  const displayTitle = scenario.scenarioTitle ?? "Scenario"
  const optimalResponse = responses.find((r) => r.isOptimal) ?? null

  // ── Submit handler ──────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedId) return
    setSubmitting(true)
    setApiError(null)

    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedResponseId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? "Something went wrong. Your response was not saved. Please try again.")
        return
      }
      setResult(data as AttemptResult)
      if (data.beltUpdate?.beltChanged && data.beltUpdate?.newBelt) {
        setShowBeltModal(true)
      }
    } catch {
      setApiError("Something went wrong. Your response was not saved. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Retake handler ──────────────────────────────────────────────────────
  function handleRetake() {
    setSelectedId(null)
    setResult(null)
    setApiError(null)
    setShowBestResponse(false)
  }

  // ────────────────────────────────────────────────────────────────────────
  // STATE B — Results view
  // ────────────────────────────────────────────────────────────────────────
  if (result) {
    const { selectedResponse, influenceProfile } = result
    const meta = scoreMeta(selectedResponse.scoreImpact)
    const prevScore = currentInfluenceScore
    const newScore  = influenceProfile.influenceScore
    const newLevel  = influenceProfile.influenceLevel
    const lvStyle   = levelStyle(newLevel)
    const isFirstEver = !hasEverScored

    return (
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-foreground/50 mb-6 flex-wrap">
          <a href="/modules" className="hover:text-foreground transition-colors">Modules</a>
          <span>/</span>
          <a href={`/modules/${moduleId}`} className="hover:text-foreground transition-colors">{moduleName}</a>
          <span>/</span>
          <span className="text-foreground">Results</span>
        </nav>

        {/* Condensed narrative */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-2">The Scenario</p>
          <p className="text-foreground/70 text-sm leading-relaxed line-clamp-3">{scenario.narrativeText}</p>
        </div>

        {/* Selected response with score revealed */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider mb-3">Your response</p>

          <div className="rounded-lg border-2 border-[#F97316]/30 bg-[#F97316]/5 p-4 mb-4">
            <p className="text-foreground font-medium text-sm leading-relaxed mb-3">
              {selectedResponse.responseText}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>
                {selectedResponse.scoreImpact} — {meta.label}
              </span>
              {selectedResponse.isOptimal && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                  ✓ Best response
                </span>
              )}
            </div>
          </div>

          {/* Explanation */}
          {selectedResponse.explanationText && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-3">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Why</p>
              <p className="text-blue-900 text-sm leading-relaxed">{selectedResponse.explanationText}</p>
            </div>
          )}

          {/* See best response toggle — only shown when user didn't pick optimal */}
          {!selectedResponse.isOptimal && optimalResponse && (
            <div>
              <button
                onClick={() => setShowBestResponse((v) => !v)}
                className="text-sm text-[#1E3A5F] font-medium hover:underline flex items-center gap-1"
              >
                <svg className={`w-4 h-4 transition-transform ${showBestResponse ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showBestResponse ? "Hide best response" : "See best response"}
              </button>
              {showBestResponse && (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-green-800 uppercase tracking-wider">Best response</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                      10 — Best
                    </span>
                  </div>
                  <p className="text-green-900 text-sm font-medium leading-relaxed mb-2">{optimalResponse.responseText}</p>
                  {optimalResponse.explanationText && (
                    <p className="text-green-800 text-sm leading-relaxed">{optimalResponse.explanationText}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Influence Score update panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider mb-4">
            Influence Score™ Update
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            {/* Previous score */}
            {!isFirstEver && (
              <div className="text-center">
                <p className="text-xs text-foreground/40 mb-1">Previous</p>
                <p className="text-3xl font-bold text-foreground/40">{Math.round(prevScore)}</p>
              </div>
            )}

            {/* Arrow */}
            {!isFirstEver && (
              <svg className="w-6 h-6 text-foreground/30 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}

            {/* New score — animated */}
            <div className="text-center">
              <p className="text-xs text-foreground/40 mb-1">{isFirstEver ? "Your score" : "New score"}</p>
              <p
                className="text-5xl font-bold text-[#1E3A5F] transition-all duration-700"
                style={{ animation: "scoreReveal 0.6s ease-out forwards" }}
              >
                {Math.round(newScore)}
              </p>
              <p className="text-xs text-foreground/40 mt-1">out of 100</p>
            </div>

            {/* Level badge */}
            <div className="sm:ml-auto text-center sm:text-right">
              <p className="text-xs text-foreground/40 mb-2">Influence Level</p>
              <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-full border ${lvStyle.badge}`}>
                {newLevel}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#F97316] h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.round(newScore)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-foreground/30 mt-1">
              <span>30</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 sm:flex-none min-h-[44px] border border-[#1E3A5F] text-[#1E3A5F] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1E3A5F]/5 transition-colors"
          >
            Try again
          </button>
          <a
            href={`/modules/${moduleId}`}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center bg-[#1E3A5F] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#162d4a] transition-colors"
          >
            Back to module
          </a>
        </div>

        <style>{`
          @keyframes scoreReveal {
            from { opacity: 0; transform: scale(0.8); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Belt award modal — fixed overlay, renders on top of results */}
        {showBeltModal && result.beltUpdate?.newBelt && (
          <BeltAwardModal
            beltName={result.beltUpdate.newBelt}
            onClose={() => setShowBeltModal(false)}
          />
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // STATE A — Unanswered view
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-foreground/50 mb-6 flex-wrap">
        <a href="/modules" className="hover:text-foreground transition-colors">Modules</a>
        <span>/</span>
        <a href={`/modules/${moduleId}`} className="hover:text-foreground transition-colors">{moduleName}</a>
        <span>/</span>
        <span>Scenarios</span>
        <span>/</span>
        <span className="text-foreground">{displayTitle}</span>
      </nav>

      {/* Retake banner */}
      {priorAttemptCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-sm text-amber-800">
          You&apos;ve attempted this scenario before. Your Influence Score will update with this attempt.
        </div>
      )}

      {/* Scenario card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">Scenario</p>
          <span className="text-xs text-foreground/40">{scenario.xpValue} XP</span>
        </div>
        <h1 className="text-xl font-bold text-primary mb-4">{displayTitle}</h1>

        {/* Scenario video */}
        {scenario.videoUrl && (
          <div className="mb-5">
            <VideoPlayer url={scenario.videoUrl} title={displayTitle} />
          </div>
        )}

        {/* Narrative */}
        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{scenario.narrativeText}</p>
      </div>

      {/* Response options */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground/60 mb-3">
          How would you respond?
        </p>
        <div className="space-y-3">
          {responses.map((response) => {
            const isSelected = selectedId === response.id
            return (
              <button
                key={response.id}
                type="button"
                onClick={() => setSelectedId(response.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 min-h-[56px] ${
                  isSelected
                    ? "border-[#F97316] bg-[#F97316]/8 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <span
                    className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-[#F97316] bg-[#F97316]" : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <p className={`text-sm leading-relaxed ${isSelected ? "text-foreground font-medium" : "text-foreground/80"}`}>
                    {response.responseText}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* API error */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedId || submitting}
        className="w-full sm:w-auto min-h-[44px] bg-[#F97316] text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-[#e06810] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Submitting…
          </>
        ) : (
          "Submit response"
        )}
      </button>
    </div>
  )
}
