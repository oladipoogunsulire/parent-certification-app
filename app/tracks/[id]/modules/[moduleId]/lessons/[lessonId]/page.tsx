import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>
}) {
  const { id, moduleId, lessonId } = await params
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

  // Validate the lesson belongs to the correct module and track
  if (
    !lesson ||
    lesson.module.id !== moduleId ||
    lesson.module.trackId !== id
  ) {
    notFound()
  }

  // Paywall: check if this module is freely accessible
  const firstModule = await prisma.module.findFirst({
    where: { trackId: id, isActive: true },
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

  // Prev / next lesson navigation within the same module
  const lessonList = lesson.module.lessons
  const currentIndex = lessonList.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null
  const nextLesson =
    currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null
  const lessonBase = `/tracks/${id}/modules/${moduleId}/lessons`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href={`/tracks/${id}`}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
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
            Back to track
          </a>
          <div className="text-sm text-gray-500 text-right hidden sm:block">
            <span className="font-medium">{lesson.module.belt.beltLevel} Belt</span>
            <span className="mx-1">·</span>
            <span>{lesson.module.moduleTitle}</span>
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
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{lesson.lessonTitle}</h1>

        {/* Lesson content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
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

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          {prevLesson ? (
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
              {prevLesson.lessonTitle}
            </a>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <a
              href={`${lessonBase}/${nextLesson.id}`}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-700 flex items-center gap-1"
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
              href={`/tracks/${id}`}
              className="bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-green-700"
            >
              Module complete
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
