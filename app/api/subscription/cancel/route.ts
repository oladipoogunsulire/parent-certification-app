import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// POST /api/subscription/cancel
// Schedules the subscription to cancel at the end of the current billing period.
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const sub = await prisma.userSubscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    })

    if (!sub) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 400 })
    }

    if (!sub.stripeSubId) {
      return NextResponse.json({ error: "Subscription has no Stripe ID." }, { status: 400 })
    }

    // Tell Stripe to cancel at period end
    await stripe.subscriptions.update(sub.stripeSubId, {
      cancel_at_period_end: true,
    })

    // Update our DB status to CANCELLING
    await prisma.userSubscription.update({
      where: { id: sub.id },
      data: { status: "CANCELLING" },
    })

    return NextResponse.json({
      success: true,
      message: "Your subscription will cancel at the end of the current billing period.",
    })
  } catch (err) {
    console.error("[POST /api/subscription/cancel]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
