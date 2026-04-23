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

// PATCH /api/admin/users/[userId]/status
// Activates or deactivates a user account. Requires a reason. Logs the action.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId } = await params

  // Prevent admin from deactivating their own account
  if (userId === admin.id) {
    return NextResponse.json(
      { error: "You cannot change the status of your own account." },
      { status: 400 }
    )
  }

  const body = await req.json()
  const { isActive, reason } = body as { isActive: boolean; reason: string }

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 })
  }

  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: "Reason must be at least 10 characters." }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 })

  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  })

  const action = isActive ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED"
  const verb   = isActive ? "activated" : "deactivated"

  await prisma.adminActionLog.create({
    data: {
      adminId:      admin.id,
      targetUserId: userId,
      action,
      detail: `Account ${verb}. Reason: ${reason.trim()}`,
    },
  })

  return NextResponse.json({
    success: true,
    message: `Account ${verb}.`,
  })
}
