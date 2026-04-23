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

// PATCH /api/admin/users/[userId]/role
// Changes a user's role. Requires a reason. Logs the action.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId } = await params

  // Prevent admin from demoting themselves
  if (userId === admin.id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    )
  }

  const body = await req.json()
  const { role, reason } = body as { role: string; reason: string }

  if (!["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role. Must be USER or ADMIN." }, { status: 400 })
  }

  if (!reason || reason.trim().length < 10) {
    return NextResponse.json({ error: "Reason must be at least 10 characters." }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!targetUser) return NextResponse.json({ error: "User not found." }, { status: 404 })

  const previousRole = targetUser.role

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as "USER" | "ADMIN" },
  })

  await prisma.adminActionLog.create({
    data: {
      adminId:      admin.id,
      targetUserId: userId,
      action:       "ROLE_CHANGED",
      detail: `Role changed to ${role} (was ${previousRole}). Reason: ${reason.trim()}`,
    },
  })

  return NextResponse.json({
    success: true,
    message: `Role updated to ${role}.`,
  })
}
