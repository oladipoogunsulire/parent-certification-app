import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { completeExamAttempt, ExamError } from "@/lib/exam-engine"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 })
  }

  const body = await req.json() as { attemptId?: string }
  const { attemptId } = body
  if (!attemptId) {
    return NextResponse.json({ error: "attemptId is required" }, { status: 400 })
  }

  try {
    const result = await completeExamAttempt(attemptId, user.id)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ExamError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error("Exam complete error:", err)
    return NextResponse.json({ error: "Failed to complete exam" }, { status: 500 })
  }
}
