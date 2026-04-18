import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import ExamPlayer from "./ExamPlayer"

export const metadata = { title: "Black Belt Exam — The Ultimate Influencer™" }

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params

  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const [user, attempt] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
    prisma.examAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, completedAt: true },
    }),
  ])

  if (!user) redirect("/login")
  if (!attempt || attempt.userId !== user.id) notFound()

  // Completed attempts redirect back to the landing page
  if (attempt.completedAt !== null) redirect("/exam")

  return (
    <ExamPlayer
      attemptId={attemptId}
      userId={user.id}
    />
  )
}
