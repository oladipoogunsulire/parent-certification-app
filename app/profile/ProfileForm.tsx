"use client"

import { useState } from "react"
import { updateProfile } from "@/app/actions/update-profile"

interface Props {
  user: {
    firstName: string
    lastName: string
    email: string
    image: string | null
    memberSince: string        // formatted e.g. "April 2026"
    accountStatus: string      // "Premium" | "Free"
  }
  stats: {
    beltsEarned: number
    modulesCompleted: number
  }
}

export default function ProfileForm({ user, stats }: Props) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName]   = useState(user.lastName)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState("")

  const fullName = `${firstName} ${lastName}`.trim() || user.email
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError("")

    const result = await updateProfile({ firstName, lastName })

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Profile header ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={fullName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold select-none shrink-0">
              {initials}
            </div>
          )}

          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-primary">{fullName}</h1>
            <p className="text-foreground/60 text-sm mt-1">{user.email}</p>
            <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              Reactive Parent
            </span>
          </div>
        </div>

        {/* ── Profile details form ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-5">Profile Details</h2>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-5 text-sm">
              Your profile has been updated.
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setSuccess(false) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setSuccess(false) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            {/* Email — read only */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-foreground/60 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-foreground/40 mt-1">Email cannot be changed</p>
            </div>

            {/* Member since + Account status row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Member since
                </label>
                <div className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-foreground/60">
                  {user.memberSince}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account status
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
                  <span className={`inline-block w-2 h-2 rounded-full ${user.accountStatus === "Premium" ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-sm text-foreground/70">{user.accountStatus}</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="min-h-[44px] bg-accent text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors w-full sm:w-auto"
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Influence Journey ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-5">Your Influence Journey</h2>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-background rounded-lg border border-gray-100 p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.beltsEarned}</p>
              <p className="text-sm text-foreground/60 mt-1">Belts Earned</p>
            </div>
            <div className="bg-background rounded-lg border border-gray-100 p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.modulesCompleted}</p>
              <p className="text-sm text-foreground/60 mt-1">Modules Completed</p>
            </div>
            <div className="bg-background rounded-lg border border-gray-100 p-4 text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-foreground/60 mt-1">Influence Score</p>
              <p className="text-xs text-accent mt-0.5 font-medium">Coming soon</p>
            </div>
          </div>

          {/* Current level */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Current level</span>
              <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                Reactive Parent
              </span>
            </div>
            <div className="text-xs text-foreground/50 flex justify-between mb-1.5">
              <span>Reactive Parent</span>
              <span>Developing Parent →</span>
            </div>
            {/* Progress bar — placeholder at 0% */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all"
                style={{ width: "0%" }}
              />
            </div>
            <p className="text-xs text-foreground/40 mt-1.5">
              Complete modules and earn belts to raise your Influence Score.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
