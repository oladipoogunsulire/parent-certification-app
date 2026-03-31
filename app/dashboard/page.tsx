import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppHeader from "@/app/components/AppHeader"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      certifications: {
        include: {
          track: true,
          belt: true,
        },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
  })

  const hasActiveSubscription = (user?.subscriptions.length ?? 0) > 0

  const firstName =
    user?.firstName ??
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    ""

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName}!
          </h2>
          <p className="text-gray-600 mt-1">
            Continue your parenting certification journey.
          </p>
        </div>

        {!hasActiveSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900">Start your certification</h3>
            <p className="text-blue-700 text-sm mt-1">
              Subscribe to access full track content, belt exams, and certification.
            </p>
            <a href="/subscribe" className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              View plans — from $29/month
            </a>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification Tracks</h3>
          {(user?.certifications.length ?? 0) === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 mb-4">You have not started any tracks yet.</p>
              <a href="/tracks" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Browse tracks
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.certifications.map((cert) => (
                <div key={cert.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900">{cert.track.trackName}</h4>
                  <p className="text-sm text-gray-500 mt-1">{cert.track.ageBand}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {cert.belt.beltLevel} Belt
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cert.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : cert.status === "IN_PROGRESS"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {cert.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Active tracks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {user?.certifications.filter((c) => c.status === "ACTIVE").length ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Certifications earned</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {user?.certifications.filter((c) => c.status === "ACTIVE").length ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Account status</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {hasActiveSubscription ? "Active" : "Free"}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}