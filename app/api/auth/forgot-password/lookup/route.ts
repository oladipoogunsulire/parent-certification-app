import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email) {
      return NextResponse.json({ hasQuestions: false, reason: "none" })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { securityQuestion: true },
    })

    // User not found — never confirm account non-existence
    if (!user) {
      return NextResponse.json({ hasQuestions: false, reason: "none" })
    }

    // Google-only account (no password hash)
    if (!user.passwordHash) {
      return NextResponse.json({ hasQuestions: false, reason: "google" })
    }

    // No security questions set up
    if (!user.securityQuestion) {
      return NextResponse.json({ hasQuestions: false, reason: "none" })
    }

    // Return questions (never return answer hashes or user IDs)
    return NextResponse.json({
      hasQuestions: true,
      question1: user.securityQuestion.question1,
      question2: user.securityQuestion.question2,
    })
  } catch (error) {
    console.error("Forgot password lookup error:", error)
    return NextResponse.json({ hasQuestions: false, reason: "none" })
  }
}
