import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UserDetailView, { type UserDetailData } from "./UserDetailView"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, name: true, email: true, displayName: true },
  })
  if (!user) return { title: "User Not Found — Admin" }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  const name = user.displayName ?? (fullName || user.name) ?? user.email
  return { title: `${name} — Admin Users` }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  })
  if (!adminUser || adminUser.role !== "ADMIN") redirect("/dashboard")

  const { userId } = await params

  const [
    userResult,
    lessonProgressResult,
    scenarioAttemptsResult,
    modulesResult,
    examAttemptsResult,
    examCertResult,
  ] = await Promise.allSettled([
    // 1 — User with subscription + influence profile
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:           true,
        email:        true,
        name:         true,
        firstName:    true,
        lastName:     true,
        displayName:  true,
        image:        true,
        role:         true,
        isActive:     true,
        currentBelt:  true,
        beltEarnedAt: true,
        createdAt:    true,
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          select: { id: true },
        },
        influenceProfile: {
          select: {
            influenceScore: true,
            influenceLevel: true,
            totalAttempts:  true,
          },
        },
      },
    }),

    // 2 — Lesson progress
    prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        lessonId:    true,
        completed:   true,
        completedAt: true,
        lesson: {
          select: {
            moduleId:    true,
            lessonTitle: true,
          },
        },
      },
    }),

    // 3 — Scenario attempts (most recent first)
    prisma.userScenarioAttempt.findMany({
      where: { userId },
      select: {
        scenarioId:  true,
        scoreEarned: true,
        completedAt: true,
        scenario: {
          select: {
            scenarioTitle: true,
            moduleId:      true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    }),

    // 4 — Active modules with their lessons + scenarios + belt level
    prisma.module.findMany({
      where: { isActive: true },
      select: {
        id:          true,
        moduleTitle: true,
        orderIndex:  true,
        belt: { select: { beltLevel: true } },
        lessons: {
          where: { isActive: true },
          select: { id: true, lessonTitle: true },
        },
        scenarios: {
          where: { isActive: true },
          select: { id: true, scenarioTitle: true },
        },
      },
      orderBy: { orderIndex: "asc" },
    }),

    // 5 — Exam attempts
    prisma.examAttempt.findMany({
      where: { userId },
      orderBy: { attemptNumber: "asc" },
      select: {
        id:              true,
        attemptNumber:   true,
        startedAt:       true,
        completedAt:     true,
        score:           true,
        passed:          true,
        timeTakenSeconds: true,
      },
    }),

    // 6 — Exam certificate
    prisma.examCertificate.findUnique({
      where: { userId },
      select: {
        certificateCode: true,
        issuedAt:        true,
        score:           true,
      },
    }),
  ])

  // If the user itself failed to load, 404
  const user = userResult.status === "fulfilled" ? userResult.value : null
  if (!user) notFound()

  // Serialize all Dates to ISO strings for client component
  const data: UserDetailData = {
    user: {
      id:           user.id,
      email:        user.email,
      name:         user.name,
      firstName:    user.firstName,
      lastName:     user.lastName,
      displayName:  user.displayName,
      image:        user.image,
      role:         user.role,
      isActive:     user.isActive,
      currentBelt:  user.currentBelt,
      beltEarnedAt: user.beltEarnedAt?.toISOString() ?? null,
      createdAt:    user.createdAt.toISOString(),
      hasActiveSub: user.subscriptions.length > 0,
      influenceProfile: user.influenceProfile
        ? {
            influenceScore: user.influenceProfile.influenceScore,
            influenceLevel: user.influenceProfile.influenceLevel,
            totalAttempts:  user.influenceProfile.totalAttempts,
          }
        : null,
    },

    lessonProgress:
      lessonProgressResult.status === "fulfilled"
        ? lessonProgressResult.value.map((lp) => ({
            lessonId:    lp.lessonId,
            completed:   lp.completed,
            completedAt: lp.completedAt?.toISOString() ?? null,
            moduleId:    lp.lesson.moduleId,
            lessonTitle: lp.lesson.lessonTitle,
          }))
        : [],

    scenarioAttempts:
      scenarioAttemptsResult.status === "fulfilled"
        ? scenarioAttemptsResult.value.map((sa) => ({
            scenarioId:    sa.scenarioId,
            scoreEarned:   sa.scoreEarned,
            completedAt:   sa.completedAt.toISOString(),
            scenarioTitle: sa.scenario.scenarioTitle,
            moduleId:      sa.scenario.moduleId,
          }))
        : [],

    modules:
      modulesResult.status === "fulfilled"
        ? modulesResult.value.map((m) => ({
            id:          m.id,
            moduleTitle: m.moduleTitle,
            orderIndex:  m.orderIndex,
            beltLevel:   m.belt.beltLevel,
            lessons:     m.lessons.map((l) => ({
              id: l.id, lessonTitle: l.lessonTitle,
            })),
            scenarios:   m.scenarios.map((s) => ({
              id: s.id, scenarioTitle: s.scenarioTitle,
            })),
          }))
        : [],

    examAttempts:
      examAttemptsResult.status === "fulfilled"
        ? examAttemptsResult.value.map((ea) => ({
            id:              ea.id,
            attemptNumber:   ea.attemptNumber,
            startedAt:       ea.startedAt.toISOString(),
            completedAt:     ea.completedAt?.toISOString() ?? null,
            score:           ea.score,
            passed:          ea.passed,
            timeTakenSeconds: ea.timeTakenSeconds,
          }))
        : [],

    examCertificate:
      examCertResult.status === "fulfilled" && examCertResult.value
        ? {
            certificateCode: examCertResult.value.certificateCode,
            issuedAt:        examCertResult.value.issuedAt.toISOString(),
            score:           examCertResult.value.score,
          }
        : null,
  }

  return <UserDetailView data={data} />
}
