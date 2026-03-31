"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RoleToggle({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string
  currentRole: string
  isSelf: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isAdmin = currentRole === "ADMIN"

  const toggle = async () => {
    if (isSelf) return
    if (
      !window.confirm(
        isAdmin
          ? "Remove admin role from this user?"
          : "Grant admin role to this user?"
      )
    )
      return

    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: isAdmin ? "USER" : "ADMIN" }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? "Failed to update role.")
    }
    setLoading(false)
  }

  if (isSelf) {
    return (
      <span className="text-xs text-gray-400 italic">you</span>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2 py-1 rounded font-medium disabled:opacity-50 ${
        isAdmin
          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {loading ? "..." : isAdmin ? "Remove admin" : "Make admin"}
    </button>
  )
}
