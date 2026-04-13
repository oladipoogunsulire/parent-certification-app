import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppHeader from "@/app/components/AppHeader"
import SetupSecurityQuestionsForm from "./SetupSecurityQuestionsForm"

export const metadata = {
  title: "Security Questions — The Ultimate Influencer™",
}

export default async function SecurityQuestionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const existing = await prisma.userSecurityQuestion.findUnique({
    where: { userId: session.user.id },
    select: { question1: true, question2: true },
  })

  return (
    <>
      <AppHeader />
      <Suspense>
        <SetupSecurityQuestionsForm
          existingQuestion1={existing?.question1 ?? null}
          existingQuestion2={existing?.question2 ?? null}
        />
      </Suspense>
    </>
  )
}
