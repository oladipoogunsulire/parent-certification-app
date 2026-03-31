import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function TrackEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      belts: { orderBy: { orderIndex: "asc" } },
      modules: {
        include: {
          lessons: true,
          belt: true,
        },
        orderBy: { orderIndex: "asc" },
      },
      questions: {
        include: {
          options: true,
          belt: true,
        },
        where: { isActive: true },
        orderBy: [{ belt: { orderIndex: "asc" } }, { createdAt: "asc" }],
      },
    },
  })

  if (!track) notFound()

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/tracks" className="text-sm text-blue-600 hover:underline">
          Back to tracks
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-gray-900">{track.trackName}</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${track.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
            {track.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">{track.description}</p>
      </div>

      {/* Belt ladder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Belt Ladder</h3>
        <div className="flex gap-2">
          {track.belts.map((belt) => (
            <div key={belt.id} className="flex-1 text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{belt.beltLevel}</p>
              <p className="text-xs text-gray-500">{belt.passingThreshold}% to pass</p>
              {belt.expirable && (
                <p className="text-xs text-orange-600 mt-1">Expires</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Modules</h3>
          <Link
            href={`/admin/tracks/${track.id}/modules/new`}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Add module
          </Link>
        </div>

        {track.modules.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No modules yet. Add your first module to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {track.modules.map((module) => (
              <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{module.moduleTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {module.belt.beltLevel} Belt • {module.lessons.length} lessons
                      {module.isFreePreview && (
                        <span className="ml-2 text-green-600">Free preview</span>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/admin/tracks/${track.id}/modules/${module.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Question Bank */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Question Bank</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {track.questions.length} question{track.questions.length !== 1 ? "s" : ""} across all belts
            </p>
          </div>
          <Link
            href={`/admin/tracks/${track.id}/questions/new`}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Add question
          </Link>
        </div>

        {track.questions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No questions yet. Add questions to enable belt exams.
          </p>
        ) : (
          <div className="space-y-2">
            {track.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${beltBadgeColor(question.belt.beltLevel)}`}>
                      {question.belt.beltLevel}
                    </span>
                    <span className="text-xs text-gray-400">
                      {question.questionType.replace("_", " ")} · Difficulty {question.difficultyLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{question.questionText}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {question.options.length} option{question.options.length !== 1 ? "s" : ""} ·{" "}
                    {question.options.filter((o) => o.isCorrect).length} correct
                  </p>
                </div>
                <Link
                  href={`/admin/tracks/${track.id}/questions/${question.id}`}
                  className="ml-4 flex-shrink-0 text-sm text-blue-600 hover:underline"
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

function beltBadgeColor(level: string): string {
  const map: Record<string, string> = {
    WHITE: "bg-gray-100 text-gray-700",
    YELLOW: "bg-yellow-100 text-yellow-800",
    GREEN: "bg-green-100 text-green-800",
    BLUE: "bg-blue-100 text-blue-800",
    BLACK: "bg-gray-800 text-white",
  }
  return map[level.toUpperCase()] ?? "bg-gray-100 text-gray-700"
}