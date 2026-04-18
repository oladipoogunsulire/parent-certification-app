import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isEligibleForExam, getUserExamHistory } from "@/lib/exam-engine"

export async function GET() {
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

  const [eligibility, history] = await Promise.all([
    isEligibleForExam(user.id),
    getUserExamHistory(user.id),
  ])

  return NextResponse.json({
    eligible:             eligibility.eligible,
    reason:               eligibility.reason,
    completedModuleCount: eligibility.completedModuleCount,
    attemptCount:         history.length,
  })
}
