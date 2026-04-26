import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/user/onboarding-complete
// Marks the current user's onboarding as complete.
export async function PATCH() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { hasSeenOnboarding: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PATCH /api/user/onboarding-complete]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
