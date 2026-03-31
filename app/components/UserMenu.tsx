"use client"

import { useState, useRef, useEffect } from "react"
import { signOut } from "next-auth/react"

type Props = {
  name: string | null
  email: string
  image: string | null
  isAdmin: boolean
}

export default function UserMenu({ name, email, image, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const label = name ?? email
  const initials = name
    ? name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : email[0].toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="User menu"
      >
        {image ? (
          <img
            src={image}
            alt={label}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold select-none">
            {initials}
          </div>
        )}
        <span className="text-sm text-foreground/80 max-w-[160px] truncate hidden sm:block">
          {label}
        </span>
        <svg
          className={`w-4 h-4 text-foreground/40 transition-transform hidden sm:block ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg border border-gray-100 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            {name && <p className="text-sm font-medium text-foreground truncate">{name}</p>}
            <p className="text-xs text-foreground/60 truncate">{email}</p>
          </div>
          <div className="py-1">
            <a
              href="/dashboard"
              className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </a>
            {isAdmin && (
              <a
                href="/admin"
                className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Admin console
              </a>
            )}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
