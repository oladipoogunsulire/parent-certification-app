import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// POST /api/subscription/portal
// Creates a Stripe billing portal session and returns the URL.
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
      where: {
        userId: user.id,
        stripeCustomerId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found." }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://parentcertification.app"}/subscription`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err) {
    console.error("[POST /api/subscription/portal]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
