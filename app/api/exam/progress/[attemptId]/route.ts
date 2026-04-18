import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getExamProgress, ExamError } from "@/lib/exam-engine"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
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

  const { attemptId } = await params

  try {
    const progress = await getExamProgress(attemptId, user.id)
    return NextResponse.json(progress)
  } catch (err) {
    if (err instanceof ExamError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error("Exam progress error:", err)
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 })
  }
}
