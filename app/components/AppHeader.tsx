import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import UserMenu from "./UserMenu"

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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-gray-900">
          Parent Certification
        </a>
        <nav className="flex items-center gap-4">
          <a href="/tracks" className="text-sm text-gray-600 hover:text-gray-900">
            Tracks
          </a>
          {userProps ? (
            <UserMenu {...userProps} />
          ) : (
            <a
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
