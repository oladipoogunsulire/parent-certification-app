import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import DeleteButton from "@/app/components/DeleteButton"

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
      scenarios: { orderBy: { createdAt: "asc" } },
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
          <DeleteButton
            url={`/api/admin/tracks/${trackId}/modules/${moduleId}`}
            confirmMessage={`Delete module "${module.moduleTitle}"? This will permanently delete all lessons and scenarios in this module.`}
            redirectTo={`/admin/tracks/${trackId}`}
            label="Delete module"
            className="text-sm text-red-600 hover:underline"
          />
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
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/tracks/${trackId}/modules/${moduleId}/lessons/${lesson.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    url={`/api/admin/tracks/${trackId}/modules/${moduleId}/lessons/${lesson.id}`}
                    confirmMessage={`Delete lesson "${lesson.lessonTitle}"? This cannot be undone.`}
                    label="Delete"
                    className="text-sm text-red-600 hover:underline"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Scenarios</h3>
            <p className="text-xs text-gray-500 mt-0.5">{module.scenarios.length} scenario{module.scenarios.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href={`/admin/tracks/${trackId}/modules/${moduleId}/scenarios/new`}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Add scenario
          </Link>
        </div>

        {module.scenarios.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No scenarios yet. Add your first scenario.
          </p>
        ) : (
          <div className="space-y-3">
            {module.scenarios.map((scenario, index) => (
              <div key={scenario.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 line-clamp-1">
                    {index + 1}. {scenario.scenarioTitle ?? scenario.narrativeText.slice(0, 80) + (scenario.narrativeText.length > 80 ? "…" : "")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Complexity {scenario.complexityLevel} • {scenario.xpValue} XP
                    {scenario.isRequired && " • Required"}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <Link
                    href={`/admin/tracks/${trackId}/modules/${moduleId}/scenarios/${scenario.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    url={`/api/admin/tracks/${trackId}/modules/${moduleId}/scenarios/${scenario.id}`}
                    confirmMessage="Delete this scenario? This cannot be undone."
                    label="Delete"
                    className="text-sm text-red-600 hover:underline"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}