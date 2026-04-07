import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import UserMenu from "./UserMenu"
import MobileNavToggle from "./MobileNavToggle"

export default async function AppHeader() {
  const session = await auth()

  let userProps: {
    name: string | null
    email: string
    image: string | null
    isAdmin: boolean
  } | null = null

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        firstName: true,
        displayName: true,
        email: true,
        image: true,
        role: true,
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
        email: user.email,
        image: user.image,
        isAdmin: user.role === "ADMIN",
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
          <a href="/tracks" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
            Modules
          </a>
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
          />
        </div>
      </div>
    </header>
  )
}
