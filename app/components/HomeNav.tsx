"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function HomeNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="shrink-0">
          <Image
            src="/image/logo-horizontal.png"
            alt="The Ultimate Influencer™"
            width={320}
            height={80}
            className="h-16 w-auto object-contain sm:h-20"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/tracks" className="text-foreground/70 hover:text-foreground transition-colors">
            Modules
          </Link>
          <Link href="/subscribe" className="text-foreground/70 hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="text-foreground/70 hover:text-foreground transition-colors">
            Sign In
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Desktop CTA */}
          <Link
            href="/register"
            className="hidden md:inline-flex bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-hover transition-colors"
          >
            Get Started Free
          </Link>

          {/* Hamburger button — mobile only */}
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
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
          <Link
            href="/tracks"
            onClick={() => setOpen(false)}
            className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Modules
          </Link>
          <Link
            href="/subscribe"
            onClick={() => setOpen(false)}
            className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center min-h-[44px] px-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <div className="pt-2 border-t border-gray-100">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center min-h-[44px] bg-accent text-white font-medium text-sm rounded-lg hover:bg-accent-hover transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
