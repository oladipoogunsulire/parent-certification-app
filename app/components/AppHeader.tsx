import { unstable_noStore as noStore } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import UserMenu from "./UserMenu"
import MobileNavToggle from "./MobileNavToggle"
import { BLACK_BELT_EXAM_ENABLED } from "@/lib/feature-flags"
import { getCompletedModuleCount } from "@/lib/module-completion"

export default async function AppHeader() {
  noStore()
  const session = await auth()

  let userProps: {
    name: string | null
    email: string
    image: string | null
    isAdmin: boolean
    hasSubscription: boolean
  } | null = null
  let showExamLink = false

  if (session?.user?.email) {
    console.log("[AppHeader] session email:", session.user.email)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id:          true,
        name:        true,
        firstName:   true,
        displayName: true,
        email:       true,
        image:       true,
        role:        true,
      },
    })

    if (user) {
      const name =
        user.displayName ??
        user.name ??
        user.firstName ??
        null

      // Check for any active or cancelling subscription
      // Use session.user.id (from JWT) as a cross-check alongside user.id from DB lookup
      console.log("[AppHeader] user.id from DB:", user.id)
      console.log("[AppHeader] session.user.id from JWT:", session.user.id)

      const activeSub = await prisma.userSubscription.findFirst({
        where: {
          userId: user.id,
          status: { in: ["ACTIVE", "CANCELLING"] },
        },
        select: { id: true, status: true },
      })

      console.log("[AppHeader] activeSub result:", activeSub)
      console.log("[AppHeader] hasSubscription:", !!activeSub)

      userProps = {
        name,
        email:           user.email,
        image:           user.image,
        isAdmin:         user.role === "ADMIN",
        hasSubscription: !!activeSub,
      }

      // Show Exam link when exam is enabled and user has unlocked it
      // (completed all 10 modules OR has a previous attempt)
      if (BLACK_BELT_EXAM_ENABLED) {
        const [completedCount, attemptCount] = await Promise.all([
          getCompletedModuleCount(user.id),
          prisma.examAttempt.count({ where: { userId: user.id } }),
        ])
        showExamLink = completedCount >= 10 || attemptCount > 0
      }
    }
  }

  return (
    <header className="relative bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <a href="/" className="text-xl font-bold text-primary shrink-0">
          The Ultimate Influencer™
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <a href="/modules" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
            Modules
          </a>
          {showExamLink && (
            <a href="/exam" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
              Exam
            </a>
          )}
          {userProps ? (
            <UserMenu {...userProps} />
          ) : (
            <a
              href="/login"
              className="text-sm font-medium text-accent hover:underline"
            >
              Sign in
            </a>
          )}
        </nav>

        {/* Mobile: show UserMenu (avatar) if logged in, then hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {userProps && <UserMenu {...userProps} />}
          <MobileNavToggle
            isLoggedIn={!!userProps}
            isAdmin={userProps?.isAdmin ?? false}
            showExamLink={showExamLink}
          />
        </div>
      </div>
    </header>
  )
}
