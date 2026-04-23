"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import RoleToggle from "./RoleToggle"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserListItem {
  id:           string
  email:        string
  name:         string | null
  firstName:    string | null
  lastName:     string | null
  displayName:  string | null
  image:        string | null
  role:         string
  isActive:     boolean
  currentBelt:  string | null
  beltEarnedAt: string | null
  createdAt:    string
  hasActiveSub: boolean
  moduleCount:  number
  isSelf:       boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BELT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "No Belt":     { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
  "White Belt":  { bg: "#F9FAFB", text: "#374151", border: "#D1D5DB" },
  "Yellow Belt": { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Green Belt":  { bg: "#DCFCE7", text: "#166534", border: "#22C55E" },
  "Blue Belt":   { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
  "Black Belt":  { bg: "#1E3A5F", text: "#FFFFFF", border: "#1E3A5F" },
}

const BELT_ORDER = ["No Belt", "White Belt", "Yellow Belt", "Green Belt", "Blue Belt", "Black Belt"]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDisplayName(u: UserListItem): string {
  if (u.displayName) return u.displayName
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim()
  if (full) return full
  if (u.name) return u.name
  return u.email.split("@")[0]
}

function getInitials(u: UserListItem): string {
  const name = getDisplayName(u)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function beltSort(belt: string | null): number {
  return BELT_ORDER.indexOf(belt ?? "No Belt")
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ user }: { user: UserListItem }) {
  const initials = getInitials(user)
  const belt = user.currentBelt ?? "No Belt"
  const color = BELT_COLORS[belt] ?? BELT_COLORS["No Belt"]

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={getDisplayName(user)}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    )
  }

  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border"
      style={{ background: color.bg, color: color.text, borderColor: color.border }}
    >
      {initials}
    </div>
  )
}

function BeltBadge({ belt }: { belt: string | null }) {
  const label = belt ?? "No Belt"
  const color = BELT_COLORS[label] ?? BELT_COLORS["No Belt"]
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"
      style={{ background: color.bg, color: color.text, borderColor: color.border }}
    >
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UsersClient({ users }: { users: UserListItem[] }) {
  const router = useRouter()
  const [search,      setSearch]      = useState("")
  const [beltFilter,  setBeltFilter]  = useState("All")
  const [subFilter,   setSubFilter]   = useState("All")
  const [roleFilter,  setRoleFilter]  = useState("All")
  const [sortBy,      setSortBy]      = useState("newest")

  const filtered = useMemo(() => {
    let result = [...users]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          getDisplayName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }

    // Belt filter
    if (beltFilter !== "All") {
      const target = beltFilter === "No Belt" ? null : beltFilter
      result = result.filter((u) => (u.currentBelt ?? null) === target)
    }

    // Subscription filter
    if (subFilter === "Active") result = result.filter((u) => u.hasActiveSub)
    if (subFilter === "Free")   result = result.filter((u) => !u.hasActiveSub)

    // Role filter
    if (roleFilter === "Admin") result = result.filter((u) => u.role === "ADMIN")
    if (roleFilter === "User")  result = result.filter((u) => u.role === "USER")

    // Sort
    if (sortBy === "newest") {
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    } else if (sortBy === "name") {
      result.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))
    } else if (sortBy === "belt") {
      result.sort((a, b) => beltSort(b.currentBelt) - beltSort(a.currentBelt))
    }

    return result
  }, [users, search, beltFilter, subFilter, roleFilter, sortBy])

  return (
    <div>
      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F]"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          >
            <option value="All">All Belts</option>
            <option value="No Belt">No Belt</option>
            <option value="White Belt">White Belt</option>
            <option value="Yellow Belt">Yellow Belt</option>
            <option value="Green Belt">Green Belt</option>
            <option value="Blue Belt">Blue Belt</option>
            <option value="Black Belt">Black Belt</option>
          </select>

          <select
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          >
            <option value="All">All Plans</option>
            <option value="Active">Active</option>
            <option value="Free">Free</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          >
            <option value="All">All Roles</option>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name A–Z</option>
            <option value="belt">Belt Level</option>
          </select>
        </div>
      </div>

      {/* ── Count ────────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-500 mb-3">
        {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
      </p>

      {/* ── Table ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-sm text-gray-400">
          No users match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Belt</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => {
                  const displayName = getDisplayName(u)
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                    >
                      {/* Avatar + name + email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Belt */}
                      <td className="px-4 py-3">
                        <BeltBadge belt={u.currentBelt} />
                      </td>

                      {/* Subscription */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.hasActiveSub
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {u.hasActiveSub ? "Active" : "Free"}
                        </span>
                      </td>

                      {/* Module progress */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {u.moduleCount} module{u.moduleCount !== 1 ? "s" : ""} completed
                        </span>
                      </td>

                      {/* Join date */}
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Actions — stop propagation so row click doesn't fire */}
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <a
                            href={`/admin/users/${u.id}`}
                            className="text-xs text-[#1E3A5F] hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                          <RoleToggle
                            userId={u.id}
                            currentRole={u.role}
                            isSelf={u.isSelf}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
