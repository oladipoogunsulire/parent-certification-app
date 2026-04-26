"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get("error")
  const urlMessage = searchParams.get("message")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password. Please try again.")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex justify-center mb-6">
          <Image
            src="/image/logo-vertical.png"
            alt="The Ultimate Influencer™"
            width={400}
            height={200}
            className="h-48 w-auto object-contain"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">Welcome back</h1>
        <p className="text-foreground/60 mb-8">Sign in to your account</p>

        {urlMessage === "password-reset" && (
          <div className="bg-green-50 text-green-800 p-3 rounded mb-4 text-sm">
            Password reset successfully. Please sign in with your new password.
          </div>
        )}

        {urlError === "UseEmailPassword" && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded mb-4 text-sm">
            An account with this email already exists. Please sign in with your email and password instead.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <a href="/forgot-password" className="text-xs text-foreground/50 hover:text-foreground/70 hover:underline transition-colors">
            Forgot password?
          </a>
        </div>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-foreground/40">Or</span>
            </div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="mt-4 w-full border border-primary text-primary py-3 px-4 rounded-md text-sm font-medium hover:bg-primary hover:text-white transition-colors"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-accent hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
