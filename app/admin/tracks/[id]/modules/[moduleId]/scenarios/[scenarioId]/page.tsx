import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditScenarioForm from "./EditScenarioForm"

export default async function EditScenarioPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; scenarioId: string }>
}) {
  const { id: trackId, moduleId, scenarioId } = await params

  const [scenario, track] = await Promise.all([
    prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        responses: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.track.findUnique({
      where: { id: trackId },
      include: {
        belts: { orderBy: { orderIndex: "asc" } },
      },
    }),
  ])

  if (!scenario || !track) notFound()

  return (
    <EditScenarioForm
      trackId={trackId}
      moduleId={moduleId}
      scenarioId={scenarioId}
      belts={track.belts.map((b) => ({ id: b.id, beltLevel: b.beltLevel }))}
      initial={{
        beltId: scenario.beltId,
        scenarioTitle: scenario.scenarioTitle ?? "",
        videoUrl: scenario.videoUrl ?? "",
        narrativeText: scenario.narrativeText,
        complexityLevel: scenario.complexityLevel,
        xpValue: scenario.xpValue,
        isRequired: scenario.isRequired,
        isActive: scenario.isActive,
        responses: scenario.responses.map((r) => ({
          responseText: r.responseText,
          isOptimal: r.isOptimal,
          scoreImpact: r.scoreImpact,
          explanationText: r.explanationText ?? "",
        })),
      }}
    />
  )
}
