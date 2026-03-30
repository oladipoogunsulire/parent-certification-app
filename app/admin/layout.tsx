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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold">Admin Console</h1>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/admin" className="text-gray-300 hover:text-white">
                Overview
              </a>
              <a href="/admin/tracks" className="text-gray-300 hover:text-white">
                Tracks
              </a>
              <a href="/admin/users" className="text-gray-300 hover:text-white">
                Users
              </a>
            </nav>
          </div>
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">
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