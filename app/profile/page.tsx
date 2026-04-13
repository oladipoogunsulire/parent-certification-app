import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppHeader from "@/app/components/AppHeader"
import ProfileForm from "./ProfileForm"

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
      />
    </>
  )
}
