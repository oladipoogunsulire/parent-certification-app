import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hashAnswer } from "@/lib/security-questions"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { question1, answer1, question2, answer2 } = body

    if (!question1 || !answer1 || !question2 || !answer2) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      )
    }

    if (typeof answer1 !== "string" || typeof answer2 !== "string") {
      return NextResponse.json(
        { error: "Invalid input." },
        { status: 400 }
      )
    }

    if (question1 === question2) {
      return NextResponse.json(
        { error: "Please select two different security questions." },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const answer1Hash = await hashAnswer(answer1)
    const answer2Hash = await hashAnswer(answer2)

    const existing = await prisma.userSecurityQuestion.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (existing) {
      await prisma.userSecurityQuestion.update({
        where: { userId },
        data: { question1, answer1Hash, question2, answer2Hash },
      })
    } else {
      await prisma.userSecurityQuestion.create({
        data: { userId, question1, answer1Hash, question2, answer2Hash },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Security questions setup error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
