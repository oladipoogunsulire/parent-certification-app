import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import AppHeader from "@/app/components/AppHeader"
import VideoPlayer from "@/app/components/VideoPlayer"

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const session = await auth()

  const mod = await prisma.module.findUnique({
    where: { id: moduleId, isActive: true },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      scenarios: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      belt: true,
      track: true,
    },
  })

  if (!mod) notFound()

  // Paywall check — first module in the track is always free
  const firstModuleInTrack = await prisma.module.findFirst({
    where: { trackId: mod.trackId, isActive: true },
    orderBy: { orderIndex: "asc" },
    select: { id: true },
  })
  const isFree = mod.isFreePreview || mod.id === firstModuleInTrack?.id

  if (!isFree) {
    if (!session?.user) {
      redirect("/login")
    }
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    })
    if (!sub) {
      redirect("/subscribe")
    }
  }

  // Fetch user lesson progress for this module
  const completedLessonIds = new Set<string>()
  let lastVisitedLessonId: string | null = null

  if (session?.user?.id) {
    const progressRecords = await prisma.userLessonProgress.findMany({
      where: { userId: session.user.id, lesson: { moduleId } },
      orderBy: { lastVisitedAt: "desc" },
      select: { lessonId: true, completed: true },
    })
    for (const p of progressRecords) {
      if (p.completed) completedLessonIds.add(p.lessonId)
    }
    if (progressRecords.length > 0) {
      lastVisitedLessonId = progressRecords[0].lessonId
    }
  }

  const totalLessons = mod.lessons.length
  const completedCount = completedLessonIds.size
  const allLessonsComplete = totalLessons > 0 && completedCount === totalLessons
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const isStarted = lastVisitedLessonId !== null || completedCount > 0

  // Find the best lesson to start/resume from
  const firstIncompleteLesson = mod.lessons.find(
    (l) => !completedLessonIds.has(l.id)
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-foreground/50 mb-6 min-w-0">
          <a href="/modules" className="hover:text-foreground transition-colors shrink-0">
            Modules
          </a>
          <span>/</span>
          <span className="text-foreground truncate">{mod.moduleTitle}</span>
        </div>

        {/* Module header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-4 h-4 rounded-full flex-shrink-0 ${beltDot(mod.belt.beltLevel)}`}
            />
            <span className="text-xs font-medium text-foreground/50 uppercase tracking-wide">
              {mod.belt.beltLevel} Belt
            </span>
            {isFree && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full ml-1">
                Free preview
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-primary">{mod.moduleTitle}</h1>
          {mod.description && (
            <p className="text-foreground/60 mt-2">{mod.description}</p>
          )}
        </div>

        {/* Module intro video */}
        {mod.introVideoUrl && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-2">
              Module Introduction
            </p>
            <VideoPlayer
              url={mod.introVideoUrl}
              title={`${mod.moduleTitle} — Introduction`}
            />
          </div>
        )}

        {/* Progress banner — shown when user has started */}
        {session?.user && isStarted && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {allLessonsComplete ? "Module complete!" : "Your progress"}
                  </span>
                  <span className="text-sm font-semibold text-accent">
                    {completedCount} / {totalLessons} lessons ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {!allLessonsComplete && firstIncompleteLesson && (
                <a
                  href={`/modules/${moduleId}/lessons/${firstIncompleteLesson.id}`}
                  className="flex-shrink-0 min-h-[44px] flex items-center bg-accent text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                >
                  {lastVisitedLessonId ? "Resume" : "Start"}
                </a>
              )}
            </div>
          </div>
        )}

        {/* ── Lessons section ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-primary mb-4">
            Lessons
            <span className="text-sm font-normal text-foreground/40 ml-2">
              ({totalLessons})
            </span>
          </h2>

          {mod.lessons.length === 0 ? (
            <p className="text-foreground/40 text-sm text-center py-6">
              No lessons yet.
            </p>
          ) : (
            <div className="space-y-3">
              {mod.lessons.map((lesson, index) => {
                const isCompleted = completedLessonIds.has(lesson.id)
                const isLastVisited = lesson.id === lastVisitedLessonId

                let buttonLabel = "Start"
                if (isCompleted) buttonLabel = "Review"
                else if (isLastVisited) buttonLabel = "Resume"

                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isCompleted
                        ? "border-green-200 bg-green-50/30"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Number / checkmark */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {lesson.lessonTitle}
                        </p>
                        <p className="text-xs text-foreground/40 mt-0.5">
                          {lesson.estimatedDurationMinutes
                            ? `${lesson.estimatedDurationMinutes} min · `
                            : ""}
                          {lesson.xpValue} XP
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/modules/${moduleId}/lessons/${lesson.id}`}
                      className={`ml-4 flex-shrink-0 text-sm font-medium min-h-[36px] flex items-center px-3 py-1.5 rounded-md transition-colors ${
                        isCompleted
                          ? "text-green-700 bg-green-50 hover:bg-green-100"
                          : isLastVisited && !isCompleted
                          ? "text-white bg-accent hover:bg-accent-hover"
                          : "text-accent hover:bg-accent/10"
                      }`}
                    >
                      {buttonLabel}
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Scenarios section ──────────────────────────────────── */}
        {mod.scenarios.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-primary">Scenarios</h2>
              {!allLessonsComplete && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </div>
            {!allLessonsComplete && (
              <p className="text-sm text-foreground/50 mb-4">
                Complete all lessons in this module to unlock scenarios
              </p>
            )}

            <div className="space-y-3 mt-4">
              {mod.scenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className={`p-4 rounded-lg border ${
                    allLessonsComplete
                      ? "border-gray-100"
                      : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Lock icon when locked */}
                    {!allLessonsComplete && (
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${
                          allLessonsComplete
                            ? "text-foreground"
                            : "text-foreground/40"
                        }`}
                      >
                        {index + 1}.{" "}
                        {scenario.scenarioTitle ?? `Scenario ${index + 1}`}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          allLessonsComplete
                            ? "text-foreground/50"
                            : "text-foreground/30"
                        }`}
                      >
                        Complexity {scenario.complexityLevel} · {scenario.xpValue} XP
                        {scenario.isRequired ? " · Required" : ""}
                      </p>
                      {/* Show narrative only when unlocked */}
                      {allLessonsComplete && scenario.narrativeText && (
                        <p className="text-sm text-foreground/60 mt-2 line-clamp-3">
                          {scenario.narrativeText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
