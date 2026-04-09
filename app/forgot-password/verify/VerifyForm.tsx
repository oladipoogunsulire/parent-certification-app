"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  const [question1, setQuestion1] = useState("")
  const [question2, setQuestion2] = useState("")
  const [answer1, setAnswer1] = useState("")
  const [answer2, setAnswer2] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [disabled, setDisabled] = useState(false)

  const MAX_ATTEMPTS = 5

  useEffect(() => {
    if (!email) {
      setLoadingQuestions(false)
      return
    }

    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/auth/forgot-password/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (data.hasQuestions && data.question1 && data.question2) {
          setQuestion1(data.question1)
          setQuestion2(data.question2)
        } else {
          setError("No security questions found for this account.")
        }
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoadingQuestions(false)
      }
    }

    fetchQuestions()
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answer1, answer2 }),
      })

      const data = await res.json()

      if (data.success && data.token) {
        router.push(`/forgot-password/reset?token=${encodeURIComponent(data.token)}`)
        return
      }

      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        setError("Too many incorrect attempts. Please contact support.")
        setDisabled(true)
      } else {
        setError("One or more answers are incorrect. Please try again.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:p-8">
          <p className="text-red-700 text-sm">Invalid link. Please start again.</p>
          <a href="/forgot-password" className="mt-4 inline-block text-sm text-accent hover:underline">
            Back to forgot password
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Verify your identity</h1>
        <p className="text-foreground/60 mb-8">Answer your security questions to continue.</p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {loadingQuestions ? (
          <p className="text-foreground/60 text-sm">Loading questions...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {question1}
              </label>
              <input
                type="text"
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="Your answer"
                required
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {question2}
              </label>
              <input
                type="text"
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="Your answer"
                required
                disabled={disabled}
              />
            </div>

            <button
              type="submit"
              disabled={loading || disabled}
              className="w-full bg-primary text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Verifying..." : "Verify answers"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-foreground/60">
          <a href="/forgot-password" className="text-accent hover:underline">
            Start over
          </a>
        </p>
      </div>
    </div>
  )
}
