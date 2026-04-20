import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getResourceDownloadStats } from "@/lib/analytics"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// GET /api/admin/analytics/resources?limit=20
// Returns top downloaded lesson resources
export async function GET(req: NextRequest) {
  const admin = await adminGuard()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20))

  try {
    const resources = await getResourceDownloadStats(limit)
    return NextResponse.json({ resources })
  } catch (err) {
    console.error("Analytics resources error:", err)
    return NextResponse.json({ error: "Failed to fetch resource analytics" }, { status: 500 })
  }
}
