import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature error:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        ) as Stripe.Subscription

        let plan = await prisma.subscriptionPlan.findFirst({
          where: { stripePriceId: subscription.items.data[0].price.id },
        })

        if (!plan) {
          const interval = subscription.items.data[0].price.recurring?.interval
          plan = await prisma.subscriptionPlan.create({
            data: {
              planName: interval === "year" ? "Annual" : "Monthly",
              price: interval === "year" ? 249 : 29,
              currency: "USD",
              billingInterval: interval === "year" ? "ANNUAL" : "MONTHLY",
              includesBlackBelt: true,
              stripePriceId: subscription.items.data[0].price.id,
            },
          })
        }

        await prisma.userSubscription.create({
          data: {
            userId,
            planId: plan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            stripeSubId: subscription.id,
            stripeCustomerId: session.customer as string,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await prisma.userSubscription.updateMany({
          where: { stripeSubId: subscription.id },
          data: { status: "CANCELLED" },
        })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        const subId = invoice.subscription
        if (subId) {
           await prisma.userSubscription.updateMany({
            where: { stripeSubId: subId },
            data: { status: "PAST_DUE" },
         })
      }
      break
    }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}