"use client"

import { useState } from "react"

interface Props {
  isLoggedIn: boolean
  isAdmin: boolean
}

export default function MobileNavToggle({ isLoggedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {open ? (
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg px-4 py-4 space-y-1 z-50">
          <a
            href="/tracks"
            onClick={() => setOpen(false)}
            className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Modules
          </a>
          {isLoggedIn ? (
            <>
              <a
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Dashboard
              </a>
              {isAdmin && (
                <a
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Admin Console
                </a>
              )}
            </>
          ) : (
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Sign In
            </a>
          )}
        </div>
      )}
    </>
  )
}
