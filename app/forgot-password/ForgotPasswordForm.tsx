"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/auth/forgot-password/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.hasQuestions === true) {
        router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
        return
      }

      if (data.hasQuestions === false && data.reason === "google") {
        setMessage("google")
        setLoading(false)
        return
      }

      // reason === "none" or any other case
      setMessage("none")
      setLoading(false)
    } catch {
      setMessage("none")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Reset your password</h1>
        <p className="text-foreground/60 mb-8">
          Enter your email address and we&apos;ll ask you your security questions.
        </p>

        {message === "google" && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded mb-4 text-sm">
            This account uses Google Sign-In. Please sign in with Google instead.
          </div>
        )}

        {message === "none" && (
          <div className="bg-blue-50 text-blue-800 p-3 rounded mb-4 text-sm">
            If an account exists with that email, you will be asked your security questions.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Remembered your password?{" "}
          <a href="/login" className="text-accent hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
