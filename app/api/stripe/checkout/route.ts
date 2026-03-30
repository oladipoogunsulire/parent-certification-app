import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: "Price ID required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?cancelled=true`,
      metadata: { userId: user.id },
      customer_email: user.email,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}