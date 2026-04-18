import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppHeader from "@/app/components/AppHeader"
import ProfileForm from "./ProfileForm"
import { getUserInfluenceProfile } from "@/lib/influence-score"

export const metadata = {
  title: "My Profile — The Ultimate Influencer™",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      certifications: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      ceRecords: {
        select: { id: true },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { id: true },
      },
      securityQuestion: {
        select: { id: true },
      },
    },
  })

  if (!user) redirect("/login")

  // Capitalise each word in a string
  function toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
      .trim()
  }

  // If firstName/lastName are empty (e.g. Google OAuth user), derive from name field
  const derivedFirst = toTitleCase(
    user.firstName ??
    (user.name ? user.name.split(" ")[0] : "") ??
    ""
  )
  const derivedLast = toTitleCase(
    user.lastName ??
    (user.name ? user.name.split(" ").slice(1).join(" ") : "") ??
    ""
  )

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })

  const accountStatus =
    user.subscriptions.length > 0 ? "Premium" : "Free"

  // Fetch Black Belt certificate if present
  const examCertificate = await prisma.examCertificate.findUnique({
    where: { userId: user.id },
    select: { certificateCode: true, issuedAt: true, score: true },
  })

  // Influence Score™ profile + distinct scenarios attempted
  const [rawInfluenceProfile, scenarioRows] = await Promise.all([
    getUserInfluenceProfile(user.id).catch(() => null),
    prisma.userScenarioAttempt
      .findMany({
        where: { userId: user.id },
        distinct: ["scenarioId"],
        select: { scenarioId: true },
      })
      .catch(() => []),
  ])

  const influenceProfile = rawInfluenceProfile
    ? {
        hasStarted: true as const,
        influenceScore: rawInfluenceProfile.influenceScore,
        influenceLevel: rawInfluenceProfile.influenceLevel,
        totalAttempts: rawInfluenceProfile.totalAttempts,
        scenariosCompleted: scenarioRows.length,
      }
    : {
        hasStarted: false as const,
        influenceScore: 0,
        influenceLevel: "Reactive Parent",
        totalAttempts: 0,
        scenariosCompleted: scenarioRows.length,
      }

  return (
    <>
      <AppHeader />
      <ProfileForm
        user={{
          firstName: derivedFirst,
          lastName: derivedLast,
          email: user.email,
          image: user.image,
          memberSince,
          accountStatus,
        }}
        stats={{
          beltsEarned: user.certifications.length,
          modulesCompleted: user.ceRecords.length,
        }}
        hasSecurityQuestions={!!user.securityQuestion}
        influenceProfile={influenceProfile}
        certificate={
          examCertificate
            ? {
                certificateCode: examCertificate.certificateCode,
                issuedAt:        examCertificate.issuedAt.toISOString(),
                score:           examCertificate.score,
              }
            : null
        }
        userId={user.id}
      />
    </>
  )
}
