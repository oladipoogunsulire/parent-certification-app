import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAnswer } from "@/lib/security-questions"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const { answer1, answer2 } = body

    if (!email || !answer1 || !answer2) {
      return NextResponse.json({ success: false })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { securityQuestion: true },
    })

    if (!user || !user.securityQuestion) {
      return NextResponse.json({ success: false })
    }

    const [correct1, correct2] = await Promise.all([
      verifyAnswer(answer1, user.securityQuestion.answer1Hash),
      verifyAnswer(answer2, user.securityQuestion.answer2Hash),
    ])

    if (!correct1 || !correct2) {
      return NextResponse.json({ success: false })
    }

    // Both answers correct — generate a reset token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error("Forgot password verify error:", error)
    return NextResponse.json({ success: false })
  }
}
