import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getUserInfluenceProfile } from "@/lib/influence-score"
import ScenarioPlayer from "./ScenarioPlayer"
import AppHeader from "@/app/components/AppHeader"

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ moduleId: string; scenarioId: string }>
}) {
  const { moduleId, scenarioId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch scenario with responses and its parent module
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId, isActive: true },
    include: {
      responses: {
        orderBy: { createdAt: "asc" },
      },
      module: {
        include: {
          lessons: {
            where: { isActive: true },
            select: { id: true },
          },
          track: { select: { id: true } },
          belt: { select: { beltLevel: true } },
        },
      },
    },
  })

  if (!scenario || scenario.moduleId !== moduleId) {
    notFound()
  }

  // Guard: all lessons must be completed before scenarios are accessible
  const completedLessonCount = await prisma.userLessonProgress.count({
    where: {
      userId: session.user.id,
      completed: true,
      lesson: { moduleId },
    },
  })
  const totalLessons = scenario.module.lessons.length
  if (totalLessons > 0 && completedLessonCount < totalLessons) {
    redirect(`/modules/${moduleId}`)
  }

  // Fetch all active scenarios for this module — ordered consistently
  const allModuleScenarios = await prisma.scenario.findMany({
    where: { moduleId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  const allScenarioIds = allModuleScenarios.map((s) => s.id)
  const scenarioIndex  = allScenarioIds.indexOf(scenarioId) + 1   // 1-based
  const totalScenarios = allScenarioIds.length

  // Fetch which scenarios in this module the user has already attempted
  const [priorAttempts, attemptedRows, influenceProfile] = await Promise.all([
    prisma.userScenarioAttempt.findMany({
      where: { userId: session.user.id, scenarioId },
      orderBy: { attemptNumber: "asc" },
    }),
    prisma.userScenarioAttempt.findMany({
      where: {
        userId: session.user.id,
        scenarioId: { in: allScenarioIds },
      },
      distinct: ["scenarioId"],
      select: { scenarioId: true },
    }),
    getUserInfluenceProfile(session.user.id),
  ])

  const completedScenarioIds = attemptedRows.map((r) => r.scenarioId)

  // Best score across all prior attempts on this scenario (for retake banner)
  const bestPriorScore = priorAttempts.length > 0
    ? Math.max(...priorAttempts.map((a) => a.scoreEarned))
    : null

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <ScenarioPlayer
          scenario={{
            id: scenario.id,
            scenarioTitle: scenario.scenarioTitle,
            videoUrl: scenario.videoUrl,
            narrativeText: scenario.narrativeText,
            xpValue: scenario.xpValue,
          }}
          responses={scenario.responses.map((r) => ({
            id: r.id,
            responseText: r.responseText,
            isOptimal: r.isOptimal,
            scoreImpact: r.scoreImpact,
            explanationText: r.explanationText,
          }))}
          moduleId={moduleId}
          moduleName={scenario.module.moduleTitle}
          priorAttemptCount={priorAttempts.length}
          bestPriorScore={bestPriorScore}
          currentInfluenceScore={influenceProfile?.influenceScore ?? 0}
          currentInfluenceLevel={influenceProfile?.influenceLevel ?? "Reactive Parent"}
          hasEverScored={influenceProfile !== null}
          scenarioIndex={scenarioIndex}
          totalScenarios={totalScenarios}
          allScenarioIds={allScenarioIds}
          completedScenarioIds={completedScenarioIds}
        />
      </main>
    </div>
  )
}
