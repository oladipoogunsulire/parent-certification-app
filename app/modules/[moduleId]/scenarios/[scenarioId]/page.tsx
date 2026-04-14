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

  // Fetch user's prior attempts for this scenario
  const priorAttempts = await prisma.userScenarioAttempt.findMany({
    where: { userId: session.user.id, scenarioId },
    orderBy: { attemptNumber: "asc" },
  })

  // Fetch the user's current influence profile (pre-attempt state)
  const influenceProfile = await getUserInfluenceProfile(session.user.id)

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
          currentInfluenceScore={influenceProfile?.influenceScore ?? 0}
          currentInfluenceLevel={influenceProfile?.influenceLevel ?? "Reactive Parent"}
          hasEverScored={influenceProfile !== null}
        />
      </main>
    </div>
  )
}
