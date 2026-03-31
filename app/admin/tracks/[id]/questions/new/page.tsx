import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import NewQuestionForm from "./NewQuestionForm"

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: trackId } = await params

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { belts: { orderBy: { orderIndex: "asc" } } },
  })

  if (!track) notFound()

  return (
    <NewQuestionForm
      trackId={trackId}
      belts={track.belts.map((b) => ({ id: b.id, beltLevel: b.beltLevel }))}
    />
  )
}
