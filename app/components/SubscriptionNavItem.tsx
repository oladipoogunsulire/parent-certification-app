import { unstable_noStore as noStore } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CreditCard } from "lucide-react"

export default async function SubscriptionNavItem() {
  noStore()

  const session = await auth()
  if (!session?.user?.email) return null

  const activeSub = await prisma.userSubscription.findFirst({
    where: {
      user:   { email: session.user.email },
      status: { in: ["ACTIVE", "CANCELLING"] },
    },
    select: { id: true },
  })

  if (!activeSub) return null

  return (
    <a
      href="/subscription"
      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-gray-50"
    >
      <CreditCard size={14} className="text-foreground/50" />
      Manage Subscription
    </a>
  )
}
