import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUserInfluenceProfile } from "@/lib/influence-score"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 401 })
  }

  const profile = await getUserInfluenceProfile(user.id)

  if (!profile) {
    return NextResponse.json({
      influenceScore: 0,
      influenceLevel: "Reactive Parent",
      totalAttempts: 0,
      hasStarted: false,
    })
  }

  return NextResponse.json({
    ...profile,
    hasStarted: true,
  })
}
