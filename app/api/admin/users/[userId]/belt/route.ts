import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const VALID_BELTS = [
  null,
  "White Belt",
  "Yellow Belt",
  "Green Belt",
  "Blue Belt",
  "Black Belt",
]

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// PATCH /api/admin/users/[userId]/belt
// Manually adjusts a user's belt level. Requires a reason. Logs the action.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await adminGuard()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { userId } = await params

    let body: { belt?: unknown; reason?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    const { belt, reason } = body as { belt: string | null; reason: string }

    // Validate belt value
    if (!VALID_BELTS.includes(belt)) {
      return NextResponse.json({ error: "Invalid belt value." }, { status: 400 })
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ error: "Reason must be at least 10 characters." }, { status: 400 })
    }

    // Fetch current belt for logging
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentBelt: true },
    })
    if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 })

    const previousBelt = targetUser.currentBelt ?? "None"
    const newBeltLabel  = belt ?? "None"

    // Update user belt
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentBelt:  belt,
        beltEarnedAt: belt ? new Date() : null,
      },
    })

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        adminId:      admin.id,
        targetUserId: userId,
        action:       "BELT_ADJUSTED",
        detail: `Belt manually set to ${newBeltLabel} (was ${previousBelt}). Reason: ${reason.trim()}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Belt updated to ${newBeltLabel}.`,
    })
  } catch (err) {
    console.error("[PATCH /api/admin/users/[userId]/belt]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
