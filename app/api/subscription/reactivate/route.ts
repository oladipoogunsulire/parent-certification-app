import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// POST /api/subscription/reactivate
// Removes the scheduled cancellation so the subscription continues.
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
      where: { userId: user.id, status: "CANCELLING" },
      orderBy: { createdAt: "desc" },
    })

    if (!sub) {
      return NextResponse.json({ error: "No cancelling subscription found." }, { status: 400 })
    }

    if (!sub.stripeSubId) {
      return NextResponse.json({ error: "Subscription has no Stripe ID." }, { status: 400 })
    }

    // Remove the scheduled cancellation in Stripe
    await stripe.subscriptions.update(sub.stripeSubId, {
      cancel_at_period_end: false,
    })

    // Restore DB status to ACTIVE
    await prisma.userSubscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE" },
    })

    return NextResponse.json({
      success: true,
      message: "Your subscription has been reactivated.",
    })
  } catch (err) {
    console.error("[POST /api/subscription/reactivate]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
