import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import ExamClient from "./ExamClient"

export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string; beltId: string }>
}) {
  const { id: trackId, beltId } = await params

  const session = await auth()
  if (!session?.user) redirect("/login")

  // Require active subscription
  const sub = await prisma.userSubscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  })
  if (!sub) redirect("/subscribe")

  const [belt, questions] = await Promise.all([
    prisma.belt.findUnique({
      where: { id: beltId },
      include: { track: true },
    }),
    prisma.question.findMany({
      where: { beltId, isActive: true },
      include: { options: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ])

  if (!belt || belt.trackId !== trackId) notFound()

  // Strip isCorrect and explanationText before sending to client
  const questionsForClient = questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    difficultyLevel: q.difficultyLevel,
    options: q.options.map((o) => ({
      id: o.id,
      optionText: o.optionText,
    })),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href={`/tracks/${trackId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to track
          </a>
          <div className="text-sm text-gray-500">
            <span className="font-medium">{belt.beltLevel} Belt Exam</span>
            <span className="mx-2">·</span>
            <span>{belt.track.trackName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {belt.beltLevel} Belt Exam
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {questionsForClient.length} questions · {belt.passingThreshold}% required to pass
          </p>
        </div>

        {questionsForClient.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <p className="text-gray-500 font-medium">No questions available for this exam yet.</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon or contact your instructor.</p>
            <a
              href={`/tracks/${trackId}`}
              className="inline-block mt-4 text-sm text-blue-600 hover:underline"
            >
              Back to track
            </a>
          </div>
        ) : (
          <ExamClient
            trackId={trackId}
            beltId={beltId}
            beltLevel={belt.beltLevel}
            questions={questionsForClient}
          />
        )}
      </main>
    </div>
  )
}
