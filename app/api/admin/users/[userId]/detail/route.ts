import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function adminGuard() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

// GET /api/admin/users/[userId]/detail
// Returns complete user profile data for the admin user detail page.
// Used as a client-side fallback if the server component fetch fails.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId } = await params

  const [
    userResult,
    lessonProgressResult,
    scenarioAttemptsResult,
    modulesResult,
    examAttemptsResult,
    examCertResult,
  ] = await Promise.allSettled([
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
    prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        lessonId:    true,
        completed:   true,
        completedAt: true,
        lesson: {
          select: { moduleId: true, lessonTitle: true },
        },
      },
    }),
    prisma.userScenarioAttempt.findMany({
      where: { userId },
      select: {
        scenarioId:  true,
        scoreEarned: true,
        completedAt: true,
        scenario: {
          select: { scenarioTitle: true, moduleId: true },
        },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.module.findMany({
      where: { isActive: true },
      select: {
        id:          true,
        moduleTitle: true,
        orderIndex:  true,
        belt: { select: { beltLevel: true } },
        lessons:   { where: { isActive: true }, select: { id: true, lessonTitle: true } },
        scenarios: { where: { isActive: true }, select: { id: true, scenarioTitle: true } },
      },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.examAttempt.findMany({
      where: { userId },
      orderBy: { attemptNumber: "asc" },
      select: {
        id:               true,
        attemptNumber:    true,
        startedAt:        true,
        completedAt:      true,
        score:            true,
        passed:           true,
        timeTakenSeconds: true,
      },
    }),
    prisma.examCertificate.findUnique({
      where: { userId },
      select: {
        certificateCode: true,
        issuedAt:        true,
        score:           true,
      },
    }),
  ])

  const user = userResult.status === "fulfilled" ? userResult.value : null
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    user: {
      ...user,
      hasActiveSub: user.subscriptions.length > 0,
      createdAt:    user.createdAt.toISOString(),
      beltEarnedAt: user.beltEarnedAt?.toISOString() ?? null,
    },
    lessonProgress:
      lessonProgressResult.status === "fulfilled"
        ? lessonProgressResult.value.map((lp) => ({
            ...lp,
            completedAt: lp.completedAt?.toISOString() ?? null,
          }))
        : [],
    scenarioAttempts:
      scenarioAttemptsResult.status === "fulfilled"
        ? scenarioAttemptsResult.value.map((sa) => ({
            ...sa,
            completedAt: sa.completedAt.toISOString(),
          }))
        : [],
    modules:
      modulesResult.status === "fulfilled" ? modulesResult.value : [],
    examAttempts:
      examAttemptsResult.status === "fulfilled"
        ? examAttemptsResult.value.map((ea) => ({
            ...ea,
            startedAt:   ea.startedAt.toISOString(),
            completedAt: ea.completedAt?.toISOString() ?? null,
          }))
        : [],
    examCertificate:
      examCertResult.status === "fulfilled" && examCertResult.value
        ? {
            ...examCertResult.value,
            issuedAt: examCertResult.value.issuedAt.toISOString(),
          }
        : null,
  })
}
