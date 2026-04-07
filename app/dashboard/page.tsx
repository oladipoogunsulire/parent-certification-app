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
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">
            Welcome back, {firstName}!
          </h2>
          <p className="text-foreground/60 mt-1">
            Continue your influence journey.
          </p>
        </div>

        {!hasActiveSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-blue-900">Start your journey</h3>
              <p className="text-blue-700 text-sm mt-1">
                Subscribe to access full module content, belt exams, and belt mastery.
              </p>
            </div>
            <a href="/subscribe" className="self-start sm:w-auto w-full text-center inline-block mt-0 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
              View plans — from $29/month
            </a>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-primary mb-4">Influence Modules</h3>
          {(user?.certifications.length ?? 0) === 0 ? (
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-10 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-foreground/60 mb-4">Your journey starts here — browse a module to begin</p>
              <a href="/tracks" className="inline-block bg-primary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
                Browse Modules
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.certifications.map((cert) => (
                <div key={cert.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                  <h4 className="font-semibold text-foreground">{cert.track.trackName}</h4>
                  <p className="text-sm text-foreground/50 mt-1">{cert.track.ageBand}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${beltBadge(cert.belt.beltLevel)}`}>
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
          <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
            <p className="text-sm text-foreground/60">Active Modules</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {user?.certifications.filter((c) => c.status === "ACTIVE").length ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
            <p className="text-sm text-foreground/60">Belts Earned</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {user?.certifications.filter((c) => c.status === "ACTIVE").length ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
            <p className="text-sm text-foreground/60">Account status</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {hasActiveSubscription ? "Active" : "Free"}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function beltBadge(level: string): string {
  const map: Record<string, string> = {
    WHITE: "bg-gray-100 text-gray-700",
    YELLOW: "bg-yellow-100 text-yellow-700",
    ORANGE: "bg-orange-100 text-orange-700",
    GREEN: "bg-green-100 text-green-700",
    BLUE: "bg-blue-100 text-blue-700",
    BROWN: "bg-amber-100 text-amber-700",
    BLACK: "bg-gray-900 text-white",
  }
  return map[level.toUpperCase()] ?? "bg-gray-100 text-gray-700"
}
