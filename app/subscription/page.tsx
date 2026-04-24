import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import AppHeader from "@/app/components/AppHeader"
import SubscriptionManager, { type SubscriptionData } from "./SubscriptionManager"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const metadata = {
  title: "Subscription — The Ultimate Influencer™",
}

export default async function SubscriptionPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) redirect("/login")

  // Fetch the most recent subscription row
  const sub = await prisma.userSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  })

  let subscriptionData: SubscriptionData | null = null

  if (sub) {
    // Build base data from DB
    subscriptionData = {
      id:               sub.id,
      status:           sub.status as SubscriptionData["status"],
      planName:         sub.plan.planName,
      billingInterval:  sub.plan.billingInterval as "MONTHLY" | "ANNUAL",
      price:            sub.plan.price,
      currency:         sub.plan.currency,
      startDate:        sub.startDate.toISOString(),
      endDate:          sub.endDate ? sub.endDate.toISOString() : null,
      stripeSubId:      sub.stripeSubId ?? null,
      stripeCustomerId: sub.stripeCustomerId ?? null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      paymentMethod:    null,
      invoices:         [],
    }

    // Enrich with live Stripe data when possible
    if (sub.stripeSubId) {
      try {
        const [stripeSub, invoiceList] = await Promise.all([
          stripe.subscriptions.retrieve(sub.stripeSubId, {
            expand: ["default_payment_method"],
          }),
          stripe.invoices.list({ subscription: sub.stripeSubId, limit: 12 }),
        ])

        const stripeSubAny = stripeSub as unknown as {
          current_period_end: number
          cancel_at_period_end: boolean
          default_payment_method: Stripe.PaymentMethod | null
        }

        const card = stripeSubAny.default_payment_method?.card ?? null

        subscriptionData = {
          ...subscriptionData,
          currentPeriodEnd:  new Date(stripeSubAny.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: stripeSubAny.cancel_at_period_end,
          paymentMethod: card
            ? {
                brand:    card.brand,
                last4:    card.last4,
                expMonth: card.exp_month,
                expYear:  card.exp_year,
              }
            : null,
          invoices: invoiceList.data.map((inv) => ({
            id:       inv.id,
            date:     new Date(inv.created * 1000).toISOString(),
            amount:   inv.amount_paid / 100,
            currency: inv.currency,
            status:   inv.status ?? "unknown",
            pdfUrl:   inv.invoice_pdf ?? null,
          })),
        }
      } catch (err) {
        console.error("[SubscriptionPage] Stripe fetch failed:", err)
        // Fall back to DB data only — Stripe may be temporarily unavailable
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your plan, payment method, and billing history.
          </p>
        </div>

        <SubscriptionManager subscription={subscriptionData} />
      </main>
    </div>
  )
}
