"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserDetailData {
  adminId: string
  user: {
    id:           string
    email:        string
    name:         string | null
    firstName:    string | null
    lastName:     string | null
    displayName:  string | null
    image:        string | null
    role:         string
    isActive:          boolean
    currentBelt:       string | null
    beltEarnedAt:      string | null
    hasSeenOnboarding: boolean
    createdAt:    string
    hasActiveSub: boolean
    influenceProfile: {
      influenceScore: number
      influenceLevel: string
      totalAttempts:  number
    } | null
  }
  lessonProgress: {
    lessonId:    string
    completed:   boolean
    completedAt: string | null
    moduleId:    string
    lessonTitle: string
  }[]
  scenarioAttempts: {
    scenarioId:    string
    scoreEarned:   number
    completedAt:   string
    scenarioTitle: string | null
    moduleId:      string
  }[]
  modules: {
    id:          string
    moduleTitle: string
    orderIndex:  number
    beltLevel:   string
    lessons:     { id: string; lessonTitle: string }[]
    scenarios:   { id: string; scenarioTitle: string | null }[]
  }[]
  examAttempts: {
    id:               string
    attemptNumber:    number
    startedAt:        string
    completedAt:      string | null
    score:            number | null
    passed:           boolean | null
    timeTakenSeconds: number | null
  }[]
  examCertificate: {
    certificateCode: string
    issuedAt:        string
    score:           number
  } | null
  adminActionLogs: {
    id:        string
    action:    string
    detail:    string
    createdAt: string
    adminName: string | null
  }[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BELT_OPTIONS = [
  { value: "", label: "None (No Belt)" },
  { value: "White Belt",  label: "White Belt" },
  { value: "Yellow Belt", label: "Yellow Belt" },
  { value: "Green Belt",  label: "Green Belt" },
  { value: "Blue Belt",   label: "Blue Belt" },
  { value: "Black Belt",  label: "Black Belt" },
]

const BELT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "No Belt":     { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
  "White Belt":  { bg: "#F9FAFB", text: "#374151", border: "#D1D5DB" },
  "Yellow Belt": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Green Belt":  { bg: "#DCFCE7", text: "#166534", border: "#22C55E" },
  "Blue Belt":   { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
  "Black Belt":  { bg: "#1E3A5F", text: "#FFFFFF", border: "#1E3A5F" },
}

const ACTION_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  BELT_ADJUSTED:        { bg: "#DBEAFE", text: "#1E40AF", label: "Belt Adjusted" },
  PROGRESS_RESET:       { bg: "#FEF3C7", text: "#92400E", label: "Progress Reset" },
  ACCOUNT_DEACTIVATED:  { bg: "#FEE2E2", text: "#991B1B", label: "Deactivated" },
  ACCOUNT_ACTIVATED:    { bg: "#DCFCE7", text: "#166534", label: "Activated" },
  ROLE_CHANGED:         { bg: "#F3E8FF", text: "#6B21A8", label: "Role Changed" },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDisplayName(u: UserDetailData["user"]): string {
  if (u.displayName) return u.displayName
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
  if (full) return full
  if (u.name) return u.name
  return u.email.split("@")[0]
}

function getInitials(u: UserDetailData["user"]): string {
  const name = getDisplayName(u)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) {
    const hrs = Math.floor(diff / 3_600_000)
    if (hrs === 0) {
      const mins = Math.floor(diff / 60_000)
      return mins < 2 ? "just now" : `${mins}m ago`
    }
    return `${hrs}h ago`
  }
  if (days === 1) return "yesterday"
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

// ---------------------------------------------------------------------------
// Reusable UI atoms
// ---------------------------------------------------------------------------

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-[#1E3A5F] mb-4">{children}</h3>
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 border-l-4 border-l-[#1E3A5F]">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-[#1E3A5F]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BeltBadge({ belt }: { belt: string | null }) {
  const label = belt ?? "No Belt"
  const color = BELT_COLORS[label] ?? BELT_COLORS["No Belt"]
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ background: color.bg, color: color.text, borderColor: color.border }}
    >
      {label}
    </span>
  )
}

function MiniProgress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const colour = pct === 100 ? "#22C55E" : pct > 0 ? "#F97316" : "#E5E7EB"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: colour }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{value}/{max}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: "success" | "error"
  onDismiss: () => void
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 ${
        type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      <span>{type === "success" ? "✓" : "✗"}</span>
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm Dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title:        string
  description:  string
  confirmLabel: string
  danger:       boolean
  onConfirm:    () => void
  onCancel:     () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
        <h4 className="text-base font-bold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              danger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#1E3A5F] text-white hover:bg-[#162d4a]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action card wrapper
// ---------------------------------------------------------------------------

function ActionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <p className="text-sm font-bold text-[#1E3A5F]">{title}</p>
      {children}
    </div>
  )
}

function ReasonInput({
  value,
  onChange,
  placeholder,
}: {
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
}) {
  const tooShort = value.length > 0 && value.length < 10
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Reason (min 10 characters)…"}
        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] ${
          tooShort ? "border-red-300 bg-red-50" : "border-gray-200"
        }`}
      />
      {tooShort && (
        <p className="text-xs text-red-500 mt-1">{10 - value.length} more characters needed</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card 1 — Belt Adjustment
// ---------------------------------------------------------------------------

function BeltCard({
  userId,
  displayName,
  currentBelt,
  onSuccess,
  onError,
}: {
  userId:      string
  displayName: string
  currentBelt: string | null
  onSuccess:   (msg: string) => void
  onError:     (msg: string) => void
}) {
  const router = useRouter()
  const [selectedBelt, setSelectedBelt] = useState<string>(currentBelt ?? "")
  const [reason,       setReason]       = useState("")
  const [loading,      setLoading]      = useState(false)
  const [confirm,      setConfirm]      = useState(false)

  const currentLabel = currentBelt ?? "None"
  const newLabel     = selectedBelt === "" ? "None" : selectedBelt
  const reasonOk     = reason.trim().length >= 10
  const beltChanged  = selectedBelt !== (currentBelt ?? "")
  const canSave      = reasonOk && beltChanged

  async function doSave() {
    setLoading(true)
    setConfirm(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/belt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ belt: selectedBelt === "" ? null : selectedBelt, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      onSuccess(json.message ?? "Belt updated.")
      setReason("")
      router.refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title="Adjust Belt?"
          description={`Are you sure you want to change ${displayName}'s belt from ${currentLabel} to ${newLabel}? This action will be logged.`}
          confirmLabel="Yes, Update Belt"
          danger={false}
          onConfirm={doSave}
          onCancel={() => setConfirm(false)}
        />
      )}
      <ActionCard title="Adjust Belt">
        <p className="text-xs text-gray-500">Current: <BeltBadge belt={currentBelt} /></p>
        <select
          value={selectedBelt}
          onChange={(e) => setSelectedBelt(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
        >
          {BELT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ReasonInput value={reason} onChange={setReason} />
        <button
          disabled={!canSave || loading}
          onClick={() => setConfirm(true)}
          className="w-full text-sm font-bold py-2 rounded-lg bg-[#1E3A5F] text-white hover:bg-[#162d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving…" : "Save Belt"}
        </button>
      </ActionCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// Card 2 — Reset Progress
// ---------------------------------------------------------------------------

function ResetCard({
  userId,
  displayName,
  onSuccess,
  onError,
}: {
  userId:      string
  displayName: string
  onSuccess:   (msg: string) => void
  onError:     (msg: string) => void
}) {
  const router = useRouter()
  const [resetLessons,        setResetLessons]        = useState(false)
  const [resetScenarios,      setResetScenarios]      = useState(false)
  const [resetInfluenceScore, setResetInfluenceScore] = useState(false)
  const [resetBelt,           setResetBelt]           = useState(false)
  const [reason,              setReason]              = useState("")
  const [loading,             setLoading]             = useState(false)
  const [confirm,             setConfirm]             = useState(false)

  const anythingChecked = resetLessons || resetScenarios || resetInfluenceScore || resetBelt
  const reasonOk        = reason.trim().length >= 10
  const canReset        = anythingChecked && reasonOk

  const checkedLabels = [
    resetLessons   && "lesson progress",
    resetScenarios && "scenario attempts",
    resetInfluenceScore && !resetScenarios && "influence score",
    resetBelt      && "belt",
  ].filter(Boolean).join(", ")

  async function doReset() {
    setLoading(true)
    setConfirm(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetLessons,
          resetScenarios,
          resetInfluenceScore: resetInfluenceScore || resetScenarios,
          resetBelt,
          reason,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      onSuccess(json.message ?? "Progress reset.")
      setResetLessons(false)
      setResetScenarios(false)
      setResetInfluenceScore(false)
      setResetBelt(false)
      setReason("")
      router.refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  function Checkbox({
    checked,
    onChange,
    label,
  }: {
    checked: boolean; onChange: (v: boolean) => void; label: string
  }) {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 accent-[#1E3A5F]"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    )
  }

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title="Reset Progress?"
          description={`You are about to permanently delete: ${checkedLabels} for ${displayName}. This cannot be undone.`}
          confirmLabel="Yes, Reset"
          danger={true}
          onConfirm={doReset}
          onCancel={() => setConfirm(false)}
        />
      )}
      <ActionCard title="Reset Progress">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
          ⚠️ This action cannot be undone. Selected data will be permanently deleted.
        </div>
        <div className="space-y-2">
          <Checkbox checked={resetLessons}        onChange={setResetLessons}        label="Reset lesson progress" />
          <Checkbox checked={resetScenarios}      onChange={setResetScenarios}      label="Reset scenario attempts and Influence Score" />
          <Checkbox checked={resetInfluenceScore} onChange={setResetInfluenceScore} label="Reset Influence Score only" />
          <Checkbox checked={resetBelt}           onChange={setResetBelt}           label="Reset belt" />
        </div>
        <ReasonInput value={reason} onChange={setReason} />
        <button
          disabled={!canReset || loading}
          onClick={() => setConfirm(true)}
          className="w-full text-sm font-bold py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Resetting…" : "Reset Selected"}
        </button>
      </ActionCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// Card 3 — Account Status
// ---------------------------------------------------------------------------

function StatusCard({
  userId,
  displayName,
  isActive,
  isSelf,
  onSuccess,
  onError,
}: {
  userId:      string
  displayName: string
  isActive:    boolean
  isSelf:      boolean
  onSuccess:   (msg: string) => void
  onError:     (msg: string) => void
}) {
  const router  = useRouter()
  const [reason,  setReason]  = useState("")
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const reasonOk  = reason.trim().length >= 10
  const canToggle = reasonOk && !isSelf
  const willActivate = !isActive

  async function doToggle() {
    setLoading(true)
    setConfirm(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: willActivate, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      onSuccess(json.message ?? "Account status updated.")
      setReason("")
      router.refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title={willActivate ? "Activate Account?" : "Deactivate Account?"}
          description={`Are you sure you want to ${willActivate ? "activate" : "deactivate"} ${displayName}'s account? This action will be logged.`}
          confirmLabel={willActivate ? "Yes, Activate" : "Yes, Deactivate"}
          danger={!willActivate}
          onConfirm={doToggle}
          onCancel={() => setConfirm(false)}
        />
      )}
      <ActionCard title="Account Status">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Current:</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {isSelf && (
          <p className="text-xs text-amber-600">You cannot change your own account status.</p>
        )}
        <ReasonInput value={reason} onChange={setReason} />
        <button
          disabled={!canToggle || loading}
          onClick={() => setConfirm(true)}
          className={`w-full text-sm font-bold py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
            willActivate
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {loading
            ? "Updating…"
            : willActivate
            ? "Activate Account"
            : "Deactivate Account"}
        </button>
      </ActionCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// Card 4 — Role Management
// ---------------------------------------------------------------------------

function RoleCard({
  userId,
  displayName,
  currentRole,
  isSelf,
  onSuccess,
  onError,
}: {
  userId:      string
  displayName: string
  currentRole: string
  isSelf:      boolean
  onSuccess:   (msg: string) => void
  onError:     (msg: string) => void
}) {
  const router  = useRouter()
  const [reason,  setReason]  = useState("")
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const isAdmin   = currentRole === "ADMIN"
  const newRole   = isAdmin ? "USER" : "ADMIN"
  const reasonOk  = reason.trim().length >= 10
  const canToggle = reasonOk && !isSelf

  async function doToggle() {
    setLoading(true)
    setConfirm(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      onSuccess(json.message ?? "Role updated.")
      setReason("")
      router.refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {confirm && (
        <ConfirmDialog
          title={isAdmin ? "Demote to User?" : "Promote to Admin?"}
          description={`Are you sure you want to ${isAdmin ? "demote" : "promote"} ${displayName} ${isAdmin ? "from Admin to User" : "to Admin"}? This action will be logged.`}
          confirmLabel={isAdmin ? "Yes, Demote" : "Yes, Promote"}
          danger={isAdmin}
          onConfirm={doToggle}
          onCancel={() => setConfirm(false)}
        />
      )}
      <ActionCard title="Role">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Current:</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            currentRole === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-gray-100 text-gray-600"
          }`}>
            {currentRole}
          </span>
        </div>
        {isSelf && (
          <p className="text-xs text-amber-600">You cannot change your own role.</p>
        )}
        <ReasonInput value={reason} onChange={setReason} />
        <button
          disabled={!canToggle || loading}
          onClick={() => setConfirm(true)}
          className={`w-full text-sm font-bold py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
            isAdmin
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {loading
            ? "Updating…"
            : isAdmin
            ? "Demote to User"
            : "Promote to Admin"}
        </button>
      </ActionCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// Card 5 — Onboarding Reset
// ---------------------------------------------------------------------------

function OnboardingCard({
  userId,
  hasSeenOnboarding,
  onSuccess,
  onError,
}: {
  userId:            string
  hasSeenOnboarding: boolean
  onSuccess:         (msg: string) => void
  onError:           (msg: string) => void
}) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function doReset() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-onboarding`, { method: "PATCH" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed")
      onSuccess("Onboarding reset — user will see the welcome modal on next login.")
      router.refresh()
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionCard title="Onboarding">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Status:</span>
        {hasSeenOnboarding ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            Completed ✓
          </span>
        ) : (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            Not yet seen
          </span>
        )}
      </div>
      <button
        disabled={loading || !hasSeenOnboarding}
        onClick={doReset}
        className="w-full text-sm font-bold py-2 rounded-lg bg-[#1E3A5F] text-white hover:bg-[#162d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Resetting…" : "Reset Onboarding"}
      </button>
    </ActionCard>
  )
}

// ---------------------------------------------------------------------------
// Admin Actions Panel
// ---------------------------------------------------------------------------

function AdminActionsPanel({
  userId,
  adminId,
  user,
}: {
  userId:  string
  adminId: string
  user:    UserDetailData["user"]
}) {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const displayName       = getDisplayName(user)
  const isSelf            = userId === adminId

  const showSuccess = useCallback((msg: string) => {
    setToast({ message: msg, type: "success" })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const showError = useCallback((msg: string) => {
    setToast({ message: msg, type: "error" })
    setTimeout(() => setToast(null), 5000)
  }, [])

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
      <Panel className="mb-6">
        <SectionTitle>Admin Actions</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BeltCard
            userId={userId}
            displayName={displayName}
            currentBelt={user.currentBelt}
            onSuccess={showSuccess}
            onError={showError}
          />
          <ResetCard
            userId={userId}
            displayName={displayName}
            onSuccess={showSuccess}
            onError={showError}
          />
          <StatusCard
            userId={userId}
            displayName={displayName}
            isActive={user.isActive}
            isSelf={isSelf}
            onSuccess={showSuccess}
            onError={showError}
          />
          <RoleCard
            userId={userId}
            displayName={displayName}
            currentRole={user.role}
            isSelf={isSelf}
            onSuccess={showSuccess}
            onError={showError}
          />
          <OnboardingCard
            userId={userId}
            hasSeenOnboarding={user.hasSeenOnboarding}
            onSuccess={showSuccess}
            onError={showError}
          />
        </div>
      </Panel>
    </>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({ user }: { user: UserDetailData["user"] }) {
  const displayName = getDisplayName(user)
  const initials    = getInitials(user)
  const belt        = user.currentBelt ?? "No Belt"
  const beltColor   = BELT_COLORS[belt] ?? BELT_COLORS["No Belt"]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <a href="/admin/users" className="hover:text-[#1E3A5F] transition-colors">Users</a>
        <span>›</span>
        <span className="text-gray-700 font-medium truncate">{displayName}</span>
      </nav>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={displayName}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ring-2 ring-gray-100 border"
            style={{ background: beltColor.bg, color: beltColor.text, borderColor: beltColor.border }}
          >
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-[#1E3A5F] truncate">{displayName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString("en-GB", {
              month: "long", year: "numeric",
            })}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user.role === "ADMIN"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {user.role}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              user.hasActiveSub
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {user.hasActiveSub ? "Active" : "Free"}
            </span>
            <BeltBadge belt={user.currentBelt} />
          </div>
        </div>

        <a
          href="/admin/users"
          className="text-sm text-[#1E3A5F] hover:underline whitespace-nowrap flex-shrink-0"
        >
          ← Back to Users
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 1 — Influence Summary
// ---------------------------------------------------------------------------

function InfluenceSummary({
  user,
  completedModuleCount,
  uniqueScenariosAttempted,
}: {
  user: UserDetailData["user"]
  completedModuleCount: number
  uniqueScenariosAttempted: number
}) {
  const score = user.influenceProfile?.influenceScore ?? 0
  const level = user.influenceProfile?.influenceLevel ?? "—"
  return (
    <section className="mb-6">
      <SectionTitle>Influence Journey</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Influence Score"    value={`${Math.round(score)}/100`} sub={level} />
        <StatCard label="Modules Completed"  value={`${completedModuleCount} of 10`}
          sub={completedModuleCount >= 10 ? "All modules done 🎉" : undefined} />
        <StatCard label="Scenarios Attempted" value={uniqueScenariosAttempted} sub="unique scenarios" />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Section 2 — Module Breakdown
// ---------------------------------------------------------------------------

type ModuleStatus = "not_started" | "in_progress" | "complete"

interface ModuleRow {
  id: string; moduleTitle: string; orderIndex: number; beltLevel: string
  totalLessons: number; completedLessons: number; totalScenarios: number
  attemptedScenarios: number; status: ModuleStatus; completedAt: string | null
}

function statusBadge(status: ModuleStatus) {
  if (status === "complete") return (
    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Complete</span>
  )
  if (status === "in_progress") return (
    <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">In Progress</span>
  )
  return (
    <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Not Started</span>
  )
}

function ModuleBreakdown({ rows }: { rows: ModuleRow[] }) {
  if (!rows.length) return <p className="text-sm text-gray-400 py-4">No module data available.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["#", "Module", "Belt", "Lessons", "Scenarios", "Status", "Completed"].map((h) => (
              <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="py-3 px-3 text-gray-400 text-xs">{row.orderIndex}</td>
              <td className="py-3 px-3 font-medium text-gray-800">{row.moduleTitle}</td>
              <td className="py-3 px-3"><BeltBadge belt={row.beltLevel} /></td>
              <td className="py-3 px-3"><MiniProgress value={row.completedLessons} max={row.totalLessons} /></td>
              <td className="py-3 px-3"><MiniProgress value={row.attemptedScenarios} max={row.totalScenarios} /></td>
              <td className="py-3 px-3">{statusBadge(row.status)}</td>
              <td className="py-3 px-3 text-xs text-gray-400">{formatDate(row.completedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 3 — Scenario Performance
// ---------------------------------------------------------------------------

interface ScenarioRow {
  scenarioId: string; scenarioTitle: string; moduleName: string
  attempts: number; bestScore: number; lastAttempted: string
}

function ScenarioPerformance({ rows }: { rows: ScenarioRow[] }) {
  if (!rows.length) return <p className="text-sm text-gray-400 py-4 text-center">No scenarios attempted yet.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Scenario", "Module", "Attempts", "Best Score", "Last Attempted"].map((h, i) => (
              <th key={h} className={`py-2 px-3 text-xs font-medium text-gray-500 uppercase ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => (
            <tr key={row.scenarioId} className="hover:bg-gray-50">
              <td className="py-2.5 px-3 font-medium text-gray-800 max-w-[200px] truncate">{row.scenarioTitle}</td>
              <td className="py-2.5 px-3 text-gray-500 max-w-[160px] truncate">{row.moduleName}</td>
              <td className="py-2.5 px-3 text-right text-gray-600">{row.attempts}</td>
              <td className="py-2.5 px-3 text-right font-semibold text-[#1E3A5F]">{Math.round(row.bestScore)}</td>
              <td className="py-2.5 px-3 text-right text-xs text-gray-400">{formatDate(row.lastAttempted)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 4 — Exam History
// ---------------------------------------------------------------------------

function ExamHistory({
  attempts,
  certificate,
  userId,
}: {
  attempts: UserDetailData["examAttempts"]
  certificate: UserDetailData["examCertificate"]
  userId: string
}) {
  return (
    <div>
      {attempts.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No exam attempts yet.</p>
      ) : (
        <div className="overflow-x-auto mb-4">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Attempt", "Date", "Score", "Result", "Time"].map((h, i) => (
                  <th key={h} className={`py-2 px-3 text-xs font-medium text-gray-500 uppercase ${i === 0 || i === 1 ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attempts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">#{a.attemptNumber}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{formatDate(a.startedAt)}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-[#1E3A5F]">
                    {a.score !== null ? `${Math.round(a.score)}%` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {a.passed === null ? <span className="text-xs text-gray-400">—</span>
                      : a.passed ? <span className="text-green-600 font-medium text-sm">✅ Passed</span>
                      : <span className="text-red-500 font-medium text-sm">❌ Failed</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs text-gray-400">{formatTime(a.timeTakenSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {certificate && (
        <div className="bg-[#1E3A5F] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>🥋</span>
            <div>
              <p className="text-white font-bold text-sm">Certified Ultimate Influencer™</p>
              <p className="text-white/60 text-xs mt-0.5">Issued {formatDate(certificate.issuedAt)} · Score: {Math.round(certificate.score)}%</p>
              <p className="text-white/40 text-xs font-mono mt-0.5">ID: {certificate.certificateCode}</p>
            </div>
          </div>
          <a
            href={`/certificate/${userId}`}
            className="ml-auto bg-yellow-400 hover:bg-yellow-300 text-[#1E3A5F] font-bold text-xs px-4 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            View Certificate
          </a>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 5 — Recent Activity
// ---------------------------------------------------------------------------

interface ActivityItem {
  type: "lesson" | "scenario" | "exam_pass" | "exam_fail"
  label: string; date: string; sortKey: string
}

function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (!items.length) return <p className="text-sm text-gray-400 py-4">No recent activity.</p>
  function icon(t: ActivityItem["type"]) {
    return { lesson: "✅", scenario: "🎯", exam_pass: "📜", exam_fail: "📝" }[t]
  }
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
          <span className="text-base leading-none mt-0.5 flex-shrink-0">{icon(item.type)}</span>
          <p className="text-sm text-gray-700 flex-1 leading-snug">{item.label}</p>
          <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{relativeDate(item.date)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 6 — Action History
// ---------------------------------------------------------------------------

function ActionHistory({ logs }: { logs: UserDetailData["adminActionLogs"] }) {
  if (!logs.length) {
    return <p className="text-sm text-gray-400 py-4">No admin actions recorded for this user.</p>
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const badge = ACTION_BADGE[log.action] ?? { bg: "#F3F4F6", text: "#374151", label: log.action }
        return (
          <div
            key={log.id}
            className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-50 last:border-0"
          >
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 self-start"
              style={{ background: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
            <p className="text-sm text-gray-700 flex-1 leading-snug">{log.detail}</p>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-500">{log.adminName ?? "Admin"}</p>
              <p className="text-xs text-gray-400">{relativeDate(log.createdAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function UserDetailView({ data }: { data: UserDetailData }) {
  const { adminId, user, lessonProgress, scenarioAttempts, modules, examAttempts, examCertificate, adminActionLogs } = data

  // ── Module rows ──────────────────────────────────────────────────────
  const moduleRows = useMemo((): ModuleRow[] => {
    const completedLessonIds   = new Set(lessonProgress.filter((lp) => lp.completed).map((lp) => lp.lessonId))
    const attemptedScenarioIds = new Set(scenarioAttempts.map((sa) => sa.scenarioId))
    const latestPerModule      = new Map<string, string>()
    for (const lp of lessonProgress) {
      if (lp.completed && lp.completedAt) {
        const e = latestPerModule.get(lp.moduleId)
        if (!e || lp.completedAt > e) latestPerModule.set(lp.moduleId, lp.completedAt)
      }
    }
    return modules.map((mod) => {
      const completedLessons   = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length
      const attemptedScenarios = mod.scenarios.filter((s) => attemptedScenarioIds.has(s.id)).length
      const allLessonsDone     = mod.lessons.length > 0 && completedLessons === mod.lessons.length
      const allScenariosDone   = mod.scenarios.length === 0 || attemptedScenarios === mod.scenarios.length
      const status: ModuleStatus =
        allLessonsDone && allScenariosDone ? "complete"
        : completedLessons > 0 || attemptedScenarios > 0 ? "in_progress"
        : "not_started"
      return {
        id: mod.id, moduleTitle: mod.moduleTitle, orderIndex: mod.orderIndex, beltLevel: mod.beltLevel,
        totalLessons: mod.lessons.length, completedLessons,
        totalScenarios: mod.scenarios.length, attemptedScenarios,
        status,
        completedAt: status === "complete" ? (latestPerModule.get(mod.id) ?? null) : null,
      }
    })
  }, [lessonProgress, scenarioAttempts, modules])

  const completedModuleCount    = useMemo(() => moduleRows.filter((r) => r.status === "complete").length, [moduleRows])
  const uniqueScenariosAttempted = useMemo(() => new Set(scenarioAttempts.map((sa) => sa.scenarioId)).size, [scenarioAttempts])

  // ── Scenario rows ────────────────────────────────────────────────────
  const scenarioRows = useMemo((): ScenarioRow[] => {
    const moduleMap = new Map(modules.map((m) => [m.id, m.moduleTitle]))
    const byScenario = new Map<string, { title: string; moduleName: string; attempts: number; bestScore: number; lastAttempted: string }>()
    for (const sa of scenarioAttempts) {
      const e = byScenario.get(sa.scenarioId)
      if (e) {
        e.attempts++
        if (sa.scoreEarned > e.bestScore) e.bestScore = sa.scoreEarned
        if (sa.completedAt > e.lastAttempted) e.lastAttempted = sa.completedAt
      } else {
        byScenario.set(sa.scenarioId, {
          title: sa.scenarioTitle ?? "Untitled", moduleName: moduleMap.get(sa.moduleId) ?? "—",
          attempts: 1, bestScore: sa.scoreEarned, lastAttempted: sa.completedAt,
        })
      }
    }
    return Array.from(byScenario.entries())
      .map(([sid, v]) => ({ scenarioId: sid, scenarioTitle: v.title, moduleName: v.moduleName, attempts: v.attempts, bestScore: v.bestScore, lastAttempted: v.lastAttempted }))
      .sort((a, b) => b.lastAttempted.localeCompare(a.lastAttempted))
  }, [scenarioAttempts, modules])

  // ── Activity feed ────────────────────────────────────────────────────
  const activityFeed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []
    for (const lp of lessonProgress) {
      if (lp.completed && lp.completedAt) {
        items.push({ type: "lesson", label: `Completed lesson: "${lp.lessonTitle}"`, date: lp.completedAt, sortKey: lp.completedAt })
      }
    }
    for (const sa of scenarioAttempts) {
      items.push({ type: "scenario", label: `Attempted scenario: "${sa.scenarioTitle ?? "Untitled"}" — scored ${Math.round(sa.scoreEarned)}`, date: sa.completedAt, sortKey: sa.completedAt })
    }
    for (const ea of examAttempts) {
      if (ea.completedAt && ea.score !== null) {
        items.push({ type: ea.passed ? "exam_pass" : "exam_fail", label: ea.passed ? `Passed Black Belt exam — scored ${Math.round(ea.score)}%` : `Attempted Black Belt exam — scored ${Math.round(ea.score)}%`, date: ea.completedAt, sortKey: ea.completedAt })
      }
    }
    items.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    return items.slice(0, 20)
  }, [lessonProgress, scenarioAttempts, examAttempts])

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl">
      <Header user={user} />

      {/* Admin Actions */}
      <AdminActionsPanel
        userId={user.id}
        adminId={adminId}
        user={user}
      />

      {/* Influence Journey */}
      <Panel className="mb-6">
        <InfluenceSummary
          user={user}
          completedModuleCount={completedModuleCount}
          uniqueScenariosAttempted={uniqueScenariosAttempted}
        />
      </Panel>

      {/* Module Breakdown */}
      <Panel className="mb-6">
        <SectionTitle>Module Progress Breakdown</SectionTitle>
        <ModuleBreakdown rows={moduleRows} />
      </Panel>

      {/* Scenario Performance */}
      <Panel className="mb-6">
        <SectionTitle>Scenario Performance</SectionTitle>
        <ScenarioPerformance rows={scenarioRows} />
      </Panel>

      {/* Exam History */}
      <Panel className="mb-6">
        <SectionTitle>Exam History</SectionTitle>
        <ExamHistory attempts={examAttempts} certificate={examCertificate} userId={user.id} />
      </Panel>

      {/* Recent Activity */}
      <Panel className="mb-6">
        <SectionTitle>Recent Activity</SectionTitle>
        <RecentActivity items={activityFeed} />
      </Panel>

      {/* Action History */}
      <Panel className="mb-6">
        <SectionTitle>Action History</SectionTitle>
        <ActionHistory logs={adminActionLogs} />
      </Panel>
    </div>
  )
}
