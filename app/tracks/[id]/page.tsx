import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const track = await prisma.track.findUnique({
    where: { id, isActive: true },
    include: {
      belts: {
        orderBy: { orderIndex: "asc" },
        include: {
          modules: {
            where: { isActive: true },
            orderBy: { orderIndex: "asc" },
            include: {
              lessons: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (!track) notFound()

  let hasActiveSubscription = false
  if (session?.user?.id) {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    })
    hasActiveSubscription = !!sub
  }

  // Determine the globally first module across all belts (by belt orderIndex then module orderIndex)
  const firstModule = track.belts[0]?.modules[0]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-primary">
            Parent Certification
          </a>
          <div className="flex items-center gap-4">
            <a href="/tracks" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
              All Modules
            </a>
            {session?.user ? (
              <>
                <a href="/dashboard" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </>
            ) : (
              <a
                href="/login"
                className="text-sm font-medium text-accent hover:underline"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb + title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-foreground/50 mb-3 min-w-0">
            <a href="/tracks" className="hover:text-foreground transition-colors">
              Modules
            </a>
            <span>/</span>
            <span className="text-foreground truncate">{track.trackName}</span>
          </div>
          {track.ageBand && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {track.ageBand}
            </span>
          )}
          <h2 className="text-3xl font-bold text-primary mt-3">{track.trackName}</h2>
          {track.description && (
            <p className="text-foreground/60 mt-2">{track.description}</p>
          )}
        </div>

        {/* Subscription nudge */}
        {!hasActiveSubscription && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-900">
                First module is free to preview.
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Subscribe to unlock all modules and belt exams.
              </p>
            </div>
            <a
              href="/subscribe"
              className="ml-4 flex-shrink-0 bg-primary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-primary-hover transition-colors"
            >
              Subscribe
            </a>
          </div>
        )}

        {/* Belt ladder */}
        <div className="space-y-10">
          {track.belts.map((belt, beltIndex) => (
            <div key={belt.id}>
              {/* Belt header */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 border-2 border-white shadow ${beltDot(belt.beltLevel)}`}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {belt.beltLevel} Belt
                    </h3>
                    <p className="text-xs text-foreground/50">
                      Pass threshold: {belt.passingThreshold}%
                      {belt.expirable && " · Certification expires annually"}
                    </p>
                  </div>
                </div>
                {hasActiveSubscription && (
                  <a
                    href={`/tracks/${id}/belts/${belt.id}/exam`}
                    className="flex-shrink-0 text-sm font-medium bg-primary text-white px-4 py-1.5 rounded-md hover:bg-primary-hover transition-colors min-h-[44px] flex items-center"
                  >
                    Take exam
                  </a>
                )}
              </div>

              {/* Modules */}
              {belt.modules.length === 0 ? (
                <p className="text-sm text-foreground/40 ml-11">No modules yet.</p>
              ) : (
                <div className="ml-11 space-y-3">
                  {belt.modules.map((module, moduleIndex) => {
                    const isFirstModule =
                      beltIndex === 0 &&
                      moduleIndex === 0 &&
                      firstModule?.id === module.id
                    const isFree = module.isFreePreview || isFirstModule
                    const isAccessible = isFree || hasActiveSubscription
                    const firstLesson = module.lessons[0]
                    const href = firstLesson
                      ? `/tracks/${id}/modules/${module.id}/lessons/${firstLesson.id}`
                      : null

                    return (
                      <div
                        key={module.id}
                        className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!isAccessible && (
                              <svg
                                className="w-3.5 h-3.5 text-foreground/30 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <h4 className="font-medium text-foreground truncate">
                              {module.moduleTitle}
                            </h4>
                            {isFree && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                                Free preview
                              </span>
                            )}
                          </div>
                          {module.description && (
                            <p className="text-sm text-foreground/50 truncate">
                              {module.description}
                            </p>
                          )}
                          <p className="text-xs text-foreground/40 mt-1">
                            {module.xpValue} XP
                            {module.ceEligible && ` · ${module.ceValue} CE credits`}
                          </p>
                        </div>

                        <div className="ml-4 flex-shrink-0">
                          {href && isAccessible ? (
                            <a
                              href={href}
                              className="text-sm font-medium text-accent hover:underline"
                            >
                              Start
                            </a>
                          ) : href && !isAccessible ? (
                            <a
                              href="/subscribe"
                              className="text-sm font-medium text-foreground/40 hover:text-foreground/70 transition-colors"
                            >
                              Unlock
                            </a>
                          ) : (
                            <span className="text-sm text-foreground/30">No lessons</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function beltDot(level: string): string {
  const map: Record<string, string> = {
    WHITE: "bg-gray-200",
    YELLOW: "bg-yellow-400",
    ORANGE: "bg-orange-400",
    GREEN: "bg-green-500",
    BLUE: "bg-blue-500",
    BROWN: "bg-amber-600",
    BLACK: "bg-gray-900",
  }
  return map[level.toUpperCase()] ?? "bg-gray-300"
}
