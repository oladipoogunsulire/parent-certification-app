"use client"

import { useState } from "react"
import { updateProfile } from "@/app/actions/update-profile"

// ---------------------------------------------------------------------------
// PDF Download helper — reusable in certification section
// ---------------------------------------------------------------------------
function DownloadPDFButton({ userId }: { userId: string }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch(`/api/certificate/${userId}/download`)
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = "ultimate-influencer-certificate.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError("Download failed. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-1.5 min-h-[36px] px-4 py-1.5 text-sm border border-[#1E3A5F] text-[#1E3A5F] rounded-lg hover:bg-[#1E3A5F]/5 disabled:opacity-50 transition-colors"
      >
        {downloading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Download PDF
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

interface InfluenceProfile {
  hasStarted: boolean
  influenceScore: number
  influenceLevel: string
  totalAttempts: number
  scenariosCompleted: number
}

interface CertificateData {
  certificateCode: string
  issuedAt:        string  // ISO string
  score:           number
}

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
  hasSecurityQuestions: boolean
  influenceProfile: InfluenceProfile
  certificate?: CertificateData | null
  userId?: string
}

const INFLUENCE_LEVELS = [
  "Reactive Parent",
  "Developing Parent",
  "Intentional Parent",
  "Ultimate Influencer™",
] as const

function influenceBadgeClass(level: string): string {
  switch (level) {
    case "Ultimate Influencer™": return "bg-[#1E3A5F] text-yellow-400"
    case "Intentional Parent":   return "bg-[#F97316] text-white"
    case "Developing Parent":    return "bg-blue-600 text-white"
    default:                     return "bg-gray-100 text-gray-700"
  }
}

function influenceBarClass(level: string): string {
  switch (level) {
    case "Ultimate Influencer™": return "bg-[#1E3A5F]"
    case "Intentional Parent":   return "bg-[#F97316]"
    case "Developing Parent":    return "bg-blue-500"
    default:                     return "bg-gray-400"
  }
}

function influenceLevelDescription(level: string): string {
  switch (level) {
    case "Ultimate Influencer™": return "You are your child's most powerful influence"
    case "Intentional Parent":   return "You're making a real difference in your child's life"
    case "Developing Parent":    return "You're building intentional parenting habits"
    default:                     return "You're beginning your influence journey"
  }
}

function headerBadgeClass(level: string): string {
  switch (level) {
    case "Ultimate Influencer™": return "bg-[#1E3A5F]/10 text-[#1E3A5F]"
    case "Intentional Parent":   return "bg-[#F97316]/10 text-[#F97316]"
    case "Developing Parent":    return "bg-blue-100 text-blue-700"
    default:                     return "bg-accent/10 text-accent"
  }
}

export default function ProfileForm({ user, stats, hasSecurityQuestions, influenceProfile, certificate, userId }: Props) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName]   = useState(user.lastName)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState("")

  function toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
      .trim()
  }

  const fullName = toTitleCase(`${firstName} ${lastName}`.trim()) || user.email
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
            <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold ${headerBadgeClass(influenceProfile.influenceLevel)}`}>
              {influenceProfile.influenceLevel}
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

        {/* ── Account Security ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-primary mb-5">Account Security</h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {hasSecurityQuestions ? (
                <>
                  {/* Green shield */}
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0"
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
                    <p className="text-sm font-medium text-green-700">
                      Security questions set ✓
                    </p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      Your account is protected for password recovery
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Amber shield */}
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-700">
                      Security questions not set
                    </p>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      Add security questions to enable password recovery
                    </p>
                  </div>
                </>
              )}
            </div>

            <a
              href="/profile/security-questions"
              className="flex-shrink-0 text-sm font-medium text-accent hover:underline transition-colors"
            >
              {hasSecurityQuestions
                ? "Update security questions"
                : "Set up security questions"}
            </a>
          </div>
        </div>

        {/* ── Black Belt Certification ─────────────────────────────────── */}
        {certificate && userId && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-primary mb-5">Certification</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Badge */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl" aria-hidden>🥋</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1E3A5F]">Certified Ultimate Influencer™</p>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    Certified on{" "}
                    {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-foreground/50">
                    Achieved with a score of <span className="font-semibold text-[#1E3A5F]">{Math.round(certificate.score)}%</span>
                  </p>
                  <p className="font-mono text-xs text-foreground/40 mt-0.5 truncate">
                    #{certificate.certificateCode.slice(0, 12).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <a
                  href={`/certificate/${userId}`}
                  className="inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
                >
                  View Certificate
                </a>
                <DownloadPDFButton userId={userId} />
              </div>
            </div>
          </div>
        )}

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
              <p className="text-3xl font-bold text-primary">{influenceProfile.scenariosCompleted}</p>
              <p className="text-sm text-foreground/60 mt-1">Scenarios Attempted</p>
            </div>
          </div>

          {influenceProfile.hasStarted ? (
            <>
              {/* Level badge + description */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold ${influenceBadgeClass(influenceProfile.influenceLevel)}`}>
                  {influenceProfile.influenceLevel}
                </span>
              </div>
              <p className="text-sm text-foreground/60 mb-4">
                {influenceLevelDescription(influenceProfile.influenceLevel)}
              </p>

              {/* Score + progress bar */}
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-primary">
                  {Math.round(influenceProfile.influenceScore)}
                </span>
                <span className="text-sm text-foreground/50">out of 100</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${influenceBarClass(influenceProfile.influenceLevel)}`}
                  style={{ width: `${Math.round(influenceProfile.influenceScore)}%` }}
                />
              </div>
              <p className="text-xs text-foreground/40 mb-6">
                Based on {influenceProfile.totalAttempts} scenario response{influenceProfile.totalAttempts !== 1 ? "s" : ""}
              </p>

              {/* Level progression indicator */}
              <div>
                <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-3">
                  Level Progression
                </p>
                <div className="space-y-2">
                  {INFLUENCE_LEVELS.map((lvl, i) => {
                    const currentIndex = INFLUENCE_LEVELS.indexOf(
                      influenceProfile.influenceLevel as typeof INFLUENCE_LEVELS[number]
                    )
                    const isCompleted = i < currentIndex
                    const isCurrent   = i === currentIndex
                    const isUpcoming  = i > currentIndex

                    return (
                      <div key={lvl} className="flex items-center gap-3">
                        {/* Dot */}
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 border-2 ${
                            isCompleted
                              ? "bg-green-500 border-green-500"
                              : isCurrent
                              ? "bg-[#F97316] border-[#F97316]"
                              : "bg-transparent border-gray-300"
                          }`}
                        />
                        {/* Label */}
                        <span
                          className={`text-sm ${
                            isCurrent
                              ? "font-bold text-foreground"
                              : isCompleted
                              ? "text-foreground/60"
                              : "text-foreground/30"
                          }`}
                        >
                          {lvl}
                        </span>
                        {/* Current marker */}
                        {isCurrent && (
                          <span className="text-xs font-semibold text-[#F97316] ml-1">
                            ← You are here
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-foreground/60 mb-3">
                Your Influence Score™ will appear here once you complete your first scenario
              </p>
              <a
                href="/modules"
                className="inline-block bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Go to Modules
              </a>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
