import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AppHeader from "@/app/components/AppHeader"
import { isEligibleForExam, getUserExamHistory, getExamConfiguration } from "@/lib/exam-engine"
import { BLACK_BELT_EXAM_ENABLED } from "@/lib/feature-flags"
import ExamLandingClient from "./ExamLandingClient"

export const metadata = { title: "Black Belt Exam — The Ultimate Influencer™" }

export default async function ExamPage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!user) redirect("/login")

  const [eligibility, history, config, certificate] = await Promise.all([
    isEligibleForExam(user.id),
    getUserExamHistory(user.id),
    getExamConfiguration(),
    prisma.examCertificate.findUnique({
      where: { userId: user.id },
      select: { certificateCode: true },
    }),
  ])

  // Serialize — dates must be plain values for client components
  const serializedHistory = history.map((h) => ({
    id:               h.id,
    attemptNumber:    h.attemptNumber,
    completedAt:      h.completedAt?.toISOString() ?? null,
    score:            h.score ?? 0,
    passed:           h.passed ?? false,
    timeTakenSeconds: h.timeTakenSeconds,
  }))

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <ExamLandingClient
          examEnabled={BLACK_BELT_EXAM_ENABLED}
          eligible={eligibility.eligible}
          reason={eligibility.reason}
          completedModuleCount={eligibility.completedModuleCount}
          history={serializedHistory}
          config={{
            totalQuestions:   config.totalQuestions,
            isTimed:          config.isTimed,
            timeLimitMinutes: config.timeLimitMinutes,
            passingThreshold: config.passingThreshold,
          }}
          hasCertificate={certificate !== null}
          userId={user.id}
        />
      </main>
    </div>
  )
}
