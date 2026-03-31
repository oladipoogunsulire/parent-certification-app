import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function adminGuard() {
  const session = await auth()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId } = await params
  const { role } = await req.json()

  if (!["ADMIN", "USER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 })
  }

  // Prevent admins from demoting themselves
  if (userId === admin.id && role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  })

  return NextResponse.json(updated)
}
