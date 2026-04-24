import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET() {
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

    // Get the most recent subscription for this user
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    })

    if (!sub) {
      return NextResponse.json({ subscription: null })
    }

    // If we have a Stripe subscription ID, fetch live data
    let stripeData: {
      currentPeriodEnd: string | null
      cancelAtPeriodEnd: boolean
      paymentMethod: {
        brand: string
        last4: string
        expMonth: number
        expYear: number
      } | null
      invoices: Array<{
        id: string
        date: string
        amount: number
        currency: string
        status: string
        pdfUrl: string | null
      }>
    } = {
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      paymentMethod: null,
      invoices: [],
    }

    if (sub.stripeSubId) {
      try {
        const [stripeSub, invoiceList] = await Promise.all([
          stripe.subscriptions.retrieve(sub.stripeSubId, {
            expand: ["default_payment_method"],
          }),
          stripe.invoices.list({ subscription: sub.stripeSubId, limit: 12 }),
        ])

        const pm = stripeSub.default_payment_method as Stripe.PaymentMethod | null
        const card = pm?.card ?? null

        stripeData = {
          currentPeriodEnd: new Date(
            (stripeSub as unknown as { current_period_end: number }).current_period_end * 1000
          ).toISOString(),
          cancelAtPeriodEnd: (stripeSub as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end,
          paymentMethod: card
            ? {
                brand: card.brand,
                last4: card.last4,
                expMonth: card.exp_month,
                expYear: card.exp_year,
              }
            : null,
          invoices: invoiceList.data.map((inv) => ({
            id: inv.id,
            date: new Date(inv.created * 1000).toISOString(),
            amount: inv.amount_paid / 100,
            currency: inv.currency,
            status: inv.status ?? "unknown",
            pdfUrl: inv.invoice_pdf ?? null,
          })),
        }
      } catch (stripeErr) {
        console.error("[GET /api/subscription/status] Stripe fetch failed:", stripeErr)
        // Continue with DB data only — Stripe may be unreachable
      }
    }

    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        planName: sub.plan.planName,
        billingInterval: sub.plan.billingInterval,
        price: sub.plan.price,
        currency: sub.plan.currency,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate ? sub.endDate.toISOString() : null,
        stripeSubId: sub.stripeSubId,
        stripeCustomerId: sub.stripeCustomerId,
        ...stripeData,
      },
    })
  } catch (err) {
    console.error("[GET /api/subscription/status]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
