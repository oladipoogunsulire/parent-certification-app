import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getScenarioPerformance } from "@/lib/analytics"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// GET /api/admin/analytics/scenarios
// Returns per-scenario attempt stats, average scores, and optimal response rates
export async function GET() {
  const admin = await adminGuard()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const scenarios = await getScenarioPerformance()
    return NextResponse.json({ scenarios })
  } catch (err) {
    console.error("Analytics scenarios error:", err)
    return NextResponse.json({ error: "Failed to fetch scenario analytics" }, { status: 500 })
  }
}
