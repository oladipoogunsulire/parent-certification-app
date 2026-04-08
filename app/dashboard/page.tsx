import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppHeader from "@/app/components/AppHeader"
import { getRecentActivity } from "@/lib/progress"

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

  const rawFirstName =
    user?.firstName ??
    session?.user?.name?.split(" ")[0] ??
    session?.user?.email?.split("@")[0] ??
    ""
  const firstName = rawFirstName
    ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
    : ""

  // ── Progress stats ──────────────────────────────────────────────
  const userId = user?.id ?? session.user.id

  // "Modules Completed" = modules where all active lessons are marked done
  const allModulesWithLessons = await prisma.module.findMany({
    where: { isActive: true },
    select: {
      id: true,
      lessons: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  })
  const completedLessonIds = new Set(
    (
      await prisma.userLessonProgress.findMany({
        where: { userId, completed: true },
        select: { lessonId: true },
      })
    ).map((p) => p.lessonId)
  )
  const modulesCompleted = allModulesWithLessons.filter(
    (m) =>
      m.lessons.length > 0 && m.lessons.every((l) => completedLessonIds.has(l.id))
  ).length

  // "Belts Earned" = active certifications
  const beltsEarned =
    user?.certifications.filter((c) => c.status === "ACTIVE").length ?? 0

  // "Continue Learning" — most recently visited module context
  const recentActivity = await getRecentActivity(userId)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary">
            Welcome back, {firstName}!
          </h2>
          <p className="text-foreground/60 mt-1">
            Continue your influence journey.
          </p>
        </div>

        {/* Subscription nudge */}
        {!hasActiveSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-blue-900">Start your journey</h3>
              <p className="text-blue-700 text-sm mt-1">
                Subscribe to access full module content, belt exams, and belt mastery.
              </p>
            </div>
            <a
              href="/subscribe"
              className="self-start sm:w-auto w-full text-center inline-block bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              View plans — from $29/month
            </a>
          </div>
        )}

        {/* ── Continue Learning ─────────────────────────────────── */}
        {recentActivity ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
                  Continue Learning
                </p>
                <h3 className="font-semibold text-foreground truncate">
                  {recentActivity.trackName}
                </h3>
                <p className="text-sm text-foreground/50 truncate mt-0.5">
                  {recentActivity.moduleTitle}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground/50">
                      {recentActivity.completed} of {recentActivity.total} lessons
                    </span>
                    <span className="text-xs font-semibold text-accent">
                      {recentActivity.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-accent h-1.5 rounded-full transition-all"
                      style={{ width: `${recentActivity.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <a
                href={`/tracks/${recentActivity.trackId}/modules/${recentActivity.moduleId}/lessons/${recentActivity.lastLessonId}`}
                className="flex-shrink-0 min-h-[44px] flex items-center bg-accent text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
              >
                {recentActivity.isCompleted ? "Review Module" : "Resume"}
              </a>
            </div>
          </div>
        ) : (
          /* No activity yet — empty state */
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-8 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-foreground/60 mb-4">
              Your journey starts here — browse a module to begin
            </p>
            <a
              href="/tracks"
              className="inline-block bg-primary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Browse Modules
            </a>
          </div>
        )}

        {/* ── Certifications / Belts grid ───────────────────────── */}
        {(user?.certifications.length ?? 0) > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Influence Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-lg border border-gray-100 shadow-sm p-6"
                >
                  <h4 className="font-semibold text-foreground">
                    {cert.track.trackName}
                  </h4>
                  <p className="text-sm text-foreground/50 mt-1">
                    {cert.track.ageBand}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${beltBadge(cert.belt.beltLevel)}`}
                    >
                      {cert.belt.beltLevel} Belt
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        cert.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : cert.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {cert.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
            <p className="text-sm text-foreground/60">Modules Completed</p>
            <p className="text-2xl font-bold text-primary mt-1">{modulesCompleted}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
            <p className="text-sm text-foreground/60">Belts Earned</p>
            <p className="text-2xl font-bold text-primary mt-1">{beltsEarned}</p>
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
