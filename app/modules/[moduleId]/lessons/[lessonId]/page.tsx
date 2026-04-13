import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import LessonCompleteButton from "./LessonCompleteButton"
import VideoPlayer from "@/app/components/VideoPlayer"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>
}) {
  const { moduleId, lessonId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, isActive: true },
    include: {
      module: {
        include: {
          track: true,
          belt: true,
          lessons: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  // Validate lesson belongs to the correct module
  if (!lesson || lesson.module.id !== moduleId) {
    notFound()
  }

  // Paywall: check if this module is freely accessible
  const firstModule = await prisma.module.findFirst({
    where: { trackId: lesson.module.trackId, isActive: true },
    orderBy: { orderIndex: "asc" },
  })

  const isFirstModule = firstModule?.id === moduleId
  const isFree = lesson.module.isFreePreview || isFirstModule

  if (!isFree) {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    })
    if (!sub) {
      redirect("/subscribe")
    }
  }

  // Record visit and retrieve completed state
  let alreadyCompleted = false
  try {
    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
      update: { lastVisitedAt: new Date() },
      create: {
        userId: session.user.id,
        lessonId,
        lastVisitedAt: new Date(),
        completed: false,
      },
      select: { completed: true },
    })
    alreadyCompleted = progress.completed
  } catch {
    // Non-critical — don't block render
  }

  // Prev / next lesson navigation within the same module
  const lessonList = lesson.module.lessons
  const currentIndex = lessonList.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null
  const nextLesson =
    currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null
  const lessonBase = `/modules/${moduleId}/lessons`
  const moduleHref = `/modules/${moduleId}`

  // Progress counters
  const completedInModule = await prisma.userLessonProgress.count({
    where: {
      userId: session.user.id,
      completed: true,
      lesson: { moduleId },
    },
  })
  const totalInModule = lessonList.length
  const progressPct =
    totalInModule > 0
      ? Math.round((completedInModule / totalInModule) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <a
            href={moduleHref}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 shrink-0"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to module
          </a>
          <div className="text-sm text-gray-500 text-right hidden sm:block min-w-0">
            <span className="font-medium">{lesson.module.belt.beltLevel} Belt</span>
            <span className="mx-1">·</span>
            <span className="truncate">{lesson.module.moduleTitle}</span>
            <span className="ml-2 text-xs text-gray-400">
              {completedInModule}/{totalInModule} done ({progressPct}%)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Lesson meta */}
        <div className="flex items-center gap-3 mb-2 text-xs text-gray-400">
          {lesson.estimatedDurationMinutes && (
            <span>{lesson.estimatedDurationMinutes} min</span>
          )}
          <span>{lesson.xpValue} XP</span>
          <span>v{lesson.versionNumber}</span>
          <span>
            Lesson {currentIndex + 1} of {totalInModule}
          </span>
        </div>

        {/* Module progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
          <div
            className="bg-accent h-1.5 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {lesson.lessonTitle}
        </h1>

        {/* Intro video */}
        {lesson.introVideoUrl && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider mb-2">
              Introduction
            </p>
            <VideoPlayer url={lesson.introVideoUrl} title="Introduction" />
          </div>
        )}

        {/* Main lesson video */}
        {lesson.mainVideoUrl && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wider mb-2">
              {lesson.lessonTitle}
            </p>
            <VideoPlayer url={lesson.mainVideoUrl} title={lesson.lessonTitle} />
          </div>
        )}

        {/* Lesson text content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mb-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {lesson.contentBody}
        </div>

        {/* Reflection prompt */}
        {lesson.reflectionPrompt && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
            <h2 className="text-xs font-semibold text-blue-800 uppercase tracking-widest mb-2">
              Reflection
            </h2>
            <p className="text-blue-900">{lesson.reflectionPrompt}</p>
          </div>
        )}

        {/* Completion + navigation row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200">
          <LessonCompleteButton
            lessonId={lessonId}
            nextLessonHref={nextLesson ? `${lessonBase}/${nextLesson.id}` : null}
            moduleHref={moduleHref}
            initialCompleted={alreadyCompleted}
          />

          <div className="flex items-center gap-4 ml-auto">
            {prevLesson && (
              <a
                href={`${lessonBase}/${prevLesson.id}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Prev
              </a>
            )}
            {nextLesson ? (
              <a
                href={`${lessonBase}/${nextLesson.id}`}
                className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-primary-hover flex items-center gap-1 min-h-[44px]"
              >
                Next lesson
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            ) : (
              <a
                href={moduleHref}
                className="bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-green-700 min-h-[44px] flex items-center"
              >
                Back to module
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
