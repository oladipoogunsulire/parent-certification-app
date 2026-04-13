"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SECURITY_QUESTIONS } from "@/lib/security-questions"

interface Props {
  existingQuestion1: string | null
  existingQuestion2: string | null
}

export default function SetupSecurityQuestionsForm({
  existingQuestion1,
  existingQuestion2,
}: Props) {
  const router = useRouter()
  const isUpdate = !!(existingQuestion1 && existingQuestion2)

  const [question1, setQuestion1] = useState(
    existingQuestion1 ?? SECURITY_QUESTIONS[0]
  )
  const [answer1, setAnswer1] = useState("")
  const [question2, setQuestion2] = useState(
    existingQuestion2 ?? SECURITY_QUESTIONS[1]
  )
  const [answer2, setAnswer2] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (question1 === question2) {
      setError("Please select two different security questions.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/security-questions/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question1, answer1, question2, answer2 }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/profile")
      }, 1500)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-foreground/50 mb-6">
          <a
            href="/profile"
            className="hover:text-foreground transition-colors"
          >
            Profile
          </a>
          <span>/</span>
          <span className="text-foreground">Security Questions</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-primary mb-1">
            {isUpdate ? "Update Security Questions" : "Set Up Security Questions"}
          </h1>
          <p className="text-foreground/60 mb-8 text-sm">
            These help you recover your account if you forget your password
          </p>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-6 text-sm">
              Security questions saved successfully. Redirecting…
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {isUpdate && !success && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-lg p-3 mb-6 text-sm">
              Your current questions are pre-selected. Enter new answers to update them.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Question 1 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Question 1
              </label>
              <select
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                required
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Answer 1
              </label>
              <input
                type="text"
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your answer"
                required
              />
            </div>

            {/* Question 2 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Question 2
              </label>
              <select
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                required
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Answer 2
              </label>
              <input
                type="text"
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your answer"
                required
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {loading
                  ? "Saving…"
                  : isUpdate
                  ? "Update Questions"
                  : "Save Security Questions"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm">
            <a href="/profile" className="text-accent hover:underline">
              ← Back to profile
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
