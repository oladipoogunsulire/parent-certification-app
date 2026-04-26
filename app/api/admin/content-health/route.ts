import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildContentHealthReport, type ContentHealthReport } from "@/lib/content-health"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// GET /api/admin/content-health
export async function GET(): Promise<NextResponse<ContentHealthReport | { error: string }>> {
  try {
    const admin = await adminGuard()
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const report = await buildContentHealthReport()
    return NextResponse.json(report)
  } catch (err) {
    console.error("[GET /api/admin/content-health]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
