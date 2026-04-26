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

// PATCH /api/admin/users/[userId]/reset-onboarding
// Resets hasSeenOnboarding to false so the user sees the modal again.
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await adminGuard()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { userId } = await params

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 })

    await prisma.user.update({
      where: { id: userId },
      data: { hasSeenOnboarding: false },
    })

    await prisma.adminActionLog.create({
      data: {
        adminId:      admin.id,
        targetUserId: userId,
        action:       "ONBOARDING_RESET",
        detail:       "Onboarding reset — user will see the welcome modal on next login.",
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PATCH /api/admin/users/[userId]/reset-onboarding]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
