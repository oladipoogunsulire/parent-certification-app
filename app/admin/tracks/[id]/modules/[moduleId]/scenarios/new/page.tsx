import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import NewScenarioForm from "./NewScenarioForm"

export default async function NewScenarioPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const { id: trackId, moduleId } = await params

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      belts: { orderBy: { orderIndex: "asc" } },
    },
  })

  if (!track) notFound()

  return (
    <NewScenarioForm
      trackId={trackId}
      moduleId={moduleId}
      belts={track.belts.map((b) => ({ id: b.id, beltLevel: b.beltLevel }))}
    />
  )
}
