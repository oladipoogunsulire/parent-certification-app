"use client"

import { useState, useEffect } from "react"

export default function SecurityQuestionsBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/auth/security-questions/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasSecurityQuestions === false) {
          setShow(true)
        }
      })
      .catch(() => {
        // Silently ignore — don't disrupt the dashboard
      })
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        {/* Shield check icon */}
        <svg
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Protect your account
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            Set up your security questions so you can reset your password if you
            ever get locked out.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
        <a
          href="/profile/security-questions"
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-hover transition-colors whitespace-nowrap"
        >
          Set up now
        </a>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="text-amber-600 hover:text-amber-800 transition-colors p-1 rounded"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
