import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// POST /api/admin/users/[userId]/reset-progress
// Selectively resets user progress data. Requires a reason. Logs each reset.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await adminGuard()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { userId } = await params

    let body: {
      resetLessons?: unknown
      resetScenarios?: unknown
      resetInfluenceScore?: unknown
      resetBelt?: unknown
      reason?: unknown
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }

    const {
      resetLessons,
      resetScenarios,
      resetInfluenceScore,
      resetBelt,
      reason,
    } = body as {
      resetLessons:        boolean
      resetScenarios:      boolean
      resetInfluenceScore: boolean
      resetBelt:           boolean
      reason:              string
    }

    // At least one reset must be selected
    if (!resetLessons && !resetScenarios && !resetInfluenceScore && !resetBelt) {
      return NextResponse.json({ error: "Select at least one reset option." }, { status: 400 })
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ error: "Reason must be at least 10 characters." }, { status: 400 })
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 })

    const performed: string[] = []

    // Execute resets sequentially (no $transaction per spec)
    if (resetLessons) {
      await prisma.userLessonProgress.deleteMany({ where: { userId } })
      performed.push("lesson progress")
    }

    if (resetScenarios) {
      await prisma.userScenarioAttempt.deleteMany({ where: { userId } })
      performed.push("scenario attempts")
    }

    if (resetInfluenceScore) {
      // Delete rather than zero-out so it recalculates fresh on next attempt
      await prisma.userInfluenceProfile.deleteMany({ where: { userId } })
      performed.push("influence score")
    }

    if (resetBelt) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentBelt: null, beltEarnedAt: null },
      })
      performed.push("belt")
    }

    // Log one entry per reset type
    for (const item of performed) {
      const action = item === "belt" ? "BELT_ADJUSTED" : "PROGRESS_RESET"
      await prisma.adminActionLog.create({
        data: {
          adminId:      admin.id,
          targetUserId: userId,
          action,
          detail: `Reset ${item}. Reason: ${reason.trim()}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Reset completed: ${performed.join(", ")}.`,
      performed,
    })
  } catch (err) {
    console.error("[POST /api/admin/users/[userId]/reset-progress]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
