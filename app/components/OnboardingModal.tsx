"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const TOTAL_STEPS = 3

export default function OnboardingModal() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [fading, setFading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [completing, setCompleting] = useState(false)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  function dismiss() {
    setFading(true)
    setTimeout(() => setDismissed(true), 300)
  }

  async function complete() {
    setCompleting(true)
    try {
      await fetch("/api/user/onboarding-complete", { method: "PATCH" })
    } catch {
      // non-critical — proceed regardless
    }
    setFading(true)
    setTimeout(() => {
      setDismissed(true)
      router.push("/modules")
    }, 300)
  }

  if (dismissed) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1 }}
    >
      {/* Backdrop — not clickable to dismiss */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to The Influence Lab"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: step === i + 1 ? 24 : 8,
                height: 8,
                backgroundColor: step === i + 1 ? "#F97316" : "#E5E7EB",
              }}
            />
          ))}
        </div>

        <div className="px-6 sm:px-8 py-6">
          {/* ── Step 1 — Welcome ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <Image
                  src="/image/logo-horizontal.png"
                  alt="The Ultimate Influencer™"
                  width={240}
                  height={60}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </div>
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-3">
                Welcome to The Influence Lab™
              </h2>
              <p className="text-foreground/70 leading-relaxed">
                You&apos;re about to begin a journey that will permanently transform how you show up as a parent. This is not a course — it&apos;s a training system.
              </p>
            </div>
          )}

          {/* ── Step 2 — How it works ─────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-5 text-center">
                How The Influence Lab Works
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  {
                    icon: "📚",
                    title: "Complete Lessons",
                    desc: "Each module contains focused lessons on a key parenting influence principle",
                  },
                  {
                    icon: "🎯",
                    title: "Practice Scenarios",
                    desc: "Apply what you learn through real-life parenting scenarios and get instant feedback",
                  },
                  {
                    icon: "📊",
                    title: "Track Your Influence Score™",
                    desc: "Every scenario response updates your Influence Score — a real measure of your parenting effectiveness",
                  },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-4 bg-gray-50 rounded-xl p-4"
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                    <div>
                      <p className="font-semibold text-[#1E3A5F] text-sm">{title}</p>
                      <p className="text-sm text-foreground/60 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3 — Your journey starts here ────────────────────── */}
          {step === 3 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-5">
                Your Journey Starts Here
              </h2>

              {/* Belt progression */}
              <div className="flex items-center justify-center gap-1 mb-5 overflow-x-auto py-2">
                {[
                  { emoji: "⚪", label: "White", color: "#6B7280", pulse: true },
                  { emoji: "🟡", label: "Yellow", color: "#CA8A04", pulse: false },
                  { emoji: "🟢", label: "Green",  color: "#16A34A", pulse: false },
                  { emoji: "🔵", label: "Blue",   color: "#2563EB", pulse: false },
                  { emoji: "🖤", label: "Black",  color: "#111827", pulse: false },
                ].map(({ emoji, label, color, pulse }, i, arr) => (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center gap-1 min-w-[52px]">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${
                          pulse ? "animate-pulse border-[#F97316] shadow-[0_0_0_4px_rgba(249,115,22,0.2)]" : "border-transparent"
                        }`}
                        style={{ backgroundColor: pulse ? "#FFF7ED" : "#F9FAFB" }}
                      >
                        {emoji}
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: pulse ? "#F97316" : color }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-4 h-0.5 bg-gray-200 mb-4 mx-1 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-foreground/70 text-sm leading-relaxed mb-6">
                Start with Module 1 and earn your White Belt. Complete all lessons and scenarios in each module to progress.
              </p>

              <button
                ref={nextBtnRef}
                onClick={complete}
                disabled={completing}
                className="w-full bg-[#F97316] text-white font-semibold py-3 rounded-xl hover:bg-[#ea6c0a] transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
              >
                {completing ? "Getting started…" : "Begin My Journey →"}
              </button>

              <button
                onClick={dismiss}
                className="mt-3 w-full text-sm text-foreground/40 hover:text-foreground/60 transition-colors focus:outline-none"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Next button (steps 1 & 2) */}
          {step < 3 && (
            <div className="mt-6 flex justify-end">
              <button
                ref={nextBtnRef}
                onClick={() => setStep((s) => s + 1)}
                className="bg-[#1E3A5F] text-white font-semibold px-7 py-2.5 rounded-xl hover:bg-[#162d4a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
