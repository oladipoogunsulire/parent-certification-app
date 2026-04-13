import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AppHeader from "@/app/components/AppHeader"
import { redirect } from "next/navigation"
import { MULTI_TRACK_ENABLED } from "@/lib/feature-flags"

export default async function TracksPage() {
  if (!MULTI_TRACK_ENABLED) {
    redirect("/modules")
  }

  const session = await auth()
  const userId = session?.user?.id ?? null

  const tracks = await prisma.track.findMany({
    where: { isActive: true },
    include: {
      belts: { orderBy: { orderIndex: "asc" } },
      modules: {
        where: { isActive: true },
        include: {
          lessons: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // Build per-track progress map if user is logged in
  type TrackProgress = {
    completedLessons: number
    totalLessons: number
    percentage: number
    isCompleted: boolean
    isStarted: boolean
    lastVisitedLessonId: string | null
    lastVisitedModuleId: string | null
  }
  const trackProgressMap = new Map<string, TrackProgress>()

  if (userId) {
    const progressRecords = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        lesson: {
          isActive: true,
          module: { isActive: true, track: { isActive: true } },
        },
      },
      select: {
        lessonId: true,
        completed: true,
        lastVisitedAt: true,
        lesson: {
          select: { module: { select: { id: true, trackId: true } } },
        },
      },
      orderBy: { lastVisitedAt: "desc" },
    })

    // Group by trackId
    const byTrack = new Map<
      string,
      {
        completedIds: Set<string>
        lastLessonId: string | null
        lastModuleId: string | null
      }
    >()
    for (const p of progressRecords) {
      const trackId = p.lesson.module.trackId
      if (!byTrack.has(trackId)) {
        byTrack.set(trackId, {
          completedIds: new Set(),
          lastLessonId: p.lessonId,
          lastModuleId: p.lesson.module.id,
        })
      }
      if (p.completed) byTrack.get(trackId)!.completedIds.add(p.lessonId)
    }

    for (const track of tracks) {
      const totalLessons = track.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0
      )
      const prog = byTrack.get(track.id)
      const completedLessons = prog?.completedIds.size ?? 0
      const percentage =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      trackProgressMap.set(track.id, {
        completedLessons,
        totalLessons,
        percentage,
        isCompleted: totalLessons > 0 && completedLessons === totalLessons,
        isStarted: (prog?.completedIds.size ?? 0) > 0 || byTrack.has(track.id),
        lastVisitedLessonId: prog?.lastLessonId ?? null,
        lastVisitedModuleId: prog?.lastModuleId ?? null,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">Influence Modules</h2>
          <p className="text-foreground/60 mt-1">
            Choose a module to begin your parenting journey.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-foreground/50">No modules available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => {
              const prog = trackProgressMap.get(track.id)
              const totalModules = track.modules.length

              return (
                <Link
                  key={track.id}
                  href={`/tracks/${track.id}`}
                  className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-accent transition-all block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {track.ageBand ?? "All ages"}
                    </span>
                    <span className="text-xs text-foreground/40">{track.belts.length} belts</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {track.trackName}
                  </h3>
                  {track.description && (
                    <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-foreground/40">{totalModules} modules</span>
                    <div className="flex gap-1">
                      {track.belts.map((belt) => (
                        <span
                          key={belt.id}
                          title={belt.beltLevel}
                          className={`w-4 h-4 rounded-full ${beltDot(belt.beltLevel)}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Progress bar — only shown when logged in */}
                  {userId && prog && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {prog.isCompleted ? (
                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                          <span aria-hidden>✅</span>
                          <span>Completed</span>
                        </div>
                      ) : prog.isStarted ? (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-foreground/50">
                              {prog.completedLessons} of {prog.totalLessons} lessons
                            </span>
                            <span className="text-xs font-semibold text-accent">
                              {prog.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-accent h-1.5 rounded-full transition-all"
                              style={{ width: `${prog.percentage}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-foreground/40">Not started</p>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
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
