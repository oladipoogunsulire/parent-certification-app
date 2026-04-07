"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string, plan: string) => {
    setLoading(plan)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Something went wrong. Please try again.")
        setLoading(null)
      }
    } catch {
      alert("Something went wrong. Please try again.")
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Start your certification journey
          </h1>
          <p className="text-gray-600 mt-2">
            Full access to all modules, belt exams, and public certification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900">Monthly</h2>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li>✓ Full access to all certification modules</li>
              <li>✓ Belt exams and progression</li>
              <li>✓ Black Belt certification</li>
              <li>✓ Public verification page</li>
              <li>✓ Cancel anytime</li>
            </ul>
            <button
              onClick={() => handleSubscribe(
                process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
                "monthly"
              )}
              disabled={loading !== null}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === "monthly" ? "Redirecting..." : "Get started monthly"}
            </button>
          </div>

          <div className="bg-white rounded-lg border-2 border-blue-600 p-5 sm:p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
              Best value
            </div>
            <h2 className="text-xl font-bold text-gray-900">Annual</h2>
            <div className="mt-4 mb-2">
              <span className="text-4xl font-bold text-gray-900">$249</span>
              <span className="text-gray-500">/year</span>
            </div>
            <p className="text-green-600 text-sm mb-6">Save $99 compared to monthly</p>
            <ul className="space-y-3 mb-8 text-sm text-gray-600">
              <li>✓ Everything in Monthly</li>
              <li>✓ 2 months free</li>
              <li>✓ Priority support</li>
              <li>✓ Early access to new modules</li>
            </ul>
            <button
              onClick={() => handleSubscribe(
                process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
                "annual"
              )}
              disabled={loading !== null}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === "annual" ? "Redirecting..." : "Get started annually"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Back to dashboard
          </a>
        </p>
      </div>
    </div>
  )
}