import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditQuestionForm from "./EditQuestionForm"

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>
}) {
  const { id: trackId, questionId } = await params

  const [question, track] = await Promise.all([
    prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.track.findUnique({
      where: { id: trackId },
      include: { belts: { orderBy: { orderIndex: "asc" } } },
    }),
  ])

  if (!question || !track) notFound()

  return (
    <EditQuestionForm
      trackId={trackId}
      questionId={questionId}
      belts={track.belts.map((b) => ({ id: b.id, beltLevel: b.beltLevel }))}
      initial={{
        beltId: question.beltId,
        questionText: question.questionText,
        questionType: question.questionType,
        difficultyLevel: question.difficultyLevel,
        options: question.options.map((o) => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          explanationText: o.explanationText ?? "",
        })),
      }}
    />
  )
}
