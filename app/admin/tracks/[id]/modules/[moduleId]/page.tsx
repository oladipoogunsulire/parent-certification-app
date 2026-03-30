import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function ModuleEditPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const resolvedParams = await params
  const trackId = resolvedParams.id
  const moduleId = resolvedParams.moduleId

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: { orderBy: { createdAt: "asc" } },
      belt: true,
      track: true,
    },
  })

  if (!module) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/admin/tracks/${trackId}`} className="text-sm text-blue-600 hover:underline">
          Back to track
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{module.moduleTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {module.belt.beltLevel} Belt • {module.track.trackName}
              {module.isFreePreview && (
                <span className="ml-2 text-green-600 font-medium">Free preview</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Lessons</h3>
          <Link
            href={`/admin/tracks/${trackId}/modules/${moduleId}/lessons/new`}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Add lesson
          </Link>
        </div>

        {module.lessons.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No lessons yet. Add your first lesson.
          </p>
        ) : (
          <div className="space-y-3">
            {module.lessons.map((lesson, index) => (
              <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {index + 1}. {lesson.lessonTitle}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lesson.estimatedDurationMinutes} min • {lesson.xpValue} XP
                  </p>
                </div>
                <Link
                  href={`/admin/tracks/${trackId}/modules/${moduleId}/lessons/${lesson.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}