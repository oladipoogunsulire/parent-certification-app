import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getModuleCompletionRates } from "@/lib/analytics"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// GET /api/admin/analytics/modules
// Returns per-module completion rates and learner engagement
export async function GET() {
  const admin = await adminGuard()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const [modules, totalUsers] = await Promise.all([
      getModuleCompletionRates(),
      prisma.user.count(),
    ])

    return NextResponse.json({ modules, totalUsers })
  } catch (err) {
    console.error("Analytics modules error:", err)
    return NextResponse.json({ error: "Failed to fetch module analytics" }, { status: 500 })
  }
}
