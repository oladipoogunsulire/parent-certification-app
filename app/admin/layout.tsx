import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-base font-bold whitespace-nowrap">Admin Console</h1>
            <nav className="flex items-center gap-3 text-sm flex-wrap">
              <a href="/admin" className="text-white/70 hover:text-white transition-colors min-h-[36px] flex items-center">
                Overview
              </a>
              <a href="/admin/tracks" className="text-white/70 hover:text-white transition-colors min-h-[36px] flex items-center">
                Modules
              </a>
              <a href="/admin/users" className="text-white/70 hover:text-white transition-colors min-h-[36px] flex items-center">
                Users
              </a>
            </nav>
          </div>
          <a href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors whitespace-nowrap min-h-[36px] flex items-center">
            Back to app
          </a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
