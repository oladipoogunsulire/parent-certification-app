import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  getUserGrowth,
  getSubscriptionMetrics,
  getBeltDistribution,
  getExamMetrics,
  getInfluenceScoreDistribution,
  getRecentActivity,
} from "@/lib/analytics"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// GET /api/admin/analytics/overview
// Returns high-level platform metrics: user growth, subscriptions, belts, exam summary, recent activity
export async function GET() {
  const admin = await adminGuard()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const [
      userGrowth,
      subscriptions,
      beltDistribution,
      examMetrics,
      influenceDistribution,
      recentActivity,
      totalUsers,
    ] = await Promise.all([
      getUserGrowth(30),
      getSubscriptionMetrics(),
      getBeltDistribution(),
      getExamMetrics(),
      getInfluenceScoreDistribution(),
      getRecentActivity(20),
      prisma.user.count(),
    ])

    return NextResponse.json({
      totalUsers,
      userGrowth,
      subscriptions,
      beltDistribution,
      examMetrics,
      influenceDistribution,
      recentActivity,
    })
  } catch (err) {
    console.error("Analytics overview error:", err)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
