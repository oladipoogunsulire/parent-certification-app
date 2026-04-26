import Image from "next/image"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import UserMenu from "./UserMenu"
import MobileNavToggle from "./MobileNavToggle"
import SubscriptionNavItem from "./SubscriptionNavItem"
import { BLACK_BELT_EXAM_ENABLED } from "@/lib/feature-flags"
import { getCompletedModuleCount } from "@/lib/module-completion"

export default async function AppHeader() {
  const session = await auth()

  let userProps: {
    name: string | null
    email: string
    image: string | null
    isAdmin: boolean
  } | null = null
  let showExamLink = false

  if (session?.user?.email) {
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

      userProps = {
        name,
        email:   user.email,
        image:   user.image,
        isAdmin: user.role === "ADMIN",
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
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <a href="/" className="shrink-0">
          <Image
            src="/image/logo-horizontal.png"
            alt="The Ultimate Influencer™"
            width={320}
            height={80}
            className="h-16 w-auto object-contain sm:h-20"
            priority
          />
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
            <UserMenu {...userProps}><SubscriptionNavItem /></UserMenu>
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
          {userProps && <UserMenu {...userProps}><SubscriptionNavItem /></UserMenu>}
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
