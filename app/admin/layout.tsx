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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold">Admin Console</h1>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/admin" className="text-white/70 hover:text-white transition-colors">
                Overview
              </a>
              <a href="/admin/tracks" className="text-white/70 hover:text-white transition-colors">
                Modules
              </a>
              <a href="/admin/users" className="text-white/70 hover:text-white transition-colors">
                Users
              </a>
            </nav>
          </div>
          <a href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">
            Back to app
          </a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
