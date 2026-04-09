import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { hashAnswer } from "@/lib/security-questions"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, password, question1, answer1, question2, answer2 } = body
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        passwordHash,
      },
    })

    // Create security questions if all fields are provided
    if (question1 && answer1 && question2 && answer2) {
      const answer1Hash = await hashAnswer(answer1)
      const answer2Hash = await hashAnswer(answer2)

      await prisma.userSecurityQuestion.create({
        data: {
          userId: user.id,
          question1,
          answer1Hash,
          question2,
          answer2Hash,
        },
      })
    }

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
