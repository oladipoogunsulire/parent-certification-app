"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  url: string
  confirmMessage: string
  redirectTo?: string
  label?: string
  className?: string
}

export default function DeleteButton({
  url,
  confirmMessage,
  redirectTo,
  label = "Delete",
  className = "text-sm text-red-600 hover:text-red-800 disabled:opacity-50",
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(confirmMessage)) return
    setLoading(true)
    try {
      const res = await fetch(url, { method: "DELETE" })
      if (res.ok) {
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
      } else {
        const data = await res.json().catch(() => ({}))
        window.alert(data.error || "Delete failed.")
      }
    } catch {
      window.alert("Something went wrong.")
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={className}
    >
      {loading ? "Deleting..." : label}
    </button>
  )
}
