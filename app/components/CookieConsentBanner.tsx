"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "cookie-consent"

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)
  const acceptBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  useEffect(() => {
    if (visible) acceptBtnRef.current?.focus()
  }, [visible])

  function dismiss(choice: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, choice)
    setFading(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-50 transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="bg-[#1E3A5F] shadow-[0_-4px_24px_rgba(0,0,0,0.25)] px-4 py-4 sm:py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          {/* Text */}
          <p className="text-white/90 text-sm leading-relaxed flex-1">
            🍪{" "}
            We use essential cookies to keep you signed in and remember your preferences. We don&apos;t use tracking or advertising cookies.{" "}
            <Link href="/privacy" className="underline text-white hover:text-white/80 transition-colors">
              Privacy Policy
            </Link>
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              ref={acceptBtnRef}
              onClick={() => dismiss("accepted")}
              className="flex-1 sm:flex-none bg-[#F97316] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#ea6c0a] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Accept
            </button>
            <button
              onClick={() => dismiss("declined")}
              className="flex-1 sm:flex-none border border-white text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
