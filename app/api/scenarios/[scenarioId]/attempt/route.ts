import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { recordScenarioAttempt } from "@/lib/influence-score"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { scenarioId } = await params

  const body = await req.json()
  const { selectedResponseId } = body as { selectedResponseId?: string }

  if (!selectedResponseId || typeof selectedResponseId !== "string") {
    return NextResponse.json(
      { error: "selectedResponseId is required." },
      { status: 400 }
    )
  }

  // Resolve the authenticated user's database ID
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 401 })
  }

  // Validate: selectedResponseId must exist and belong to this scenario
  const selectedResponse = await prisma.scenarioResponse.findUnique({
    where: { id: selectedResponseId },
  })

  if (!selectedResponse || selectedResponse.scenarioId !== scenarioId) {
    return NextResponse.json(
      { error: "Invalid selectedResponseId for this scenario." },
      { status: 400 }
    )
  }

  try {
    // Count prior attempts to determine isRetake before recording
    const priorAttemptCount = await prisma.userScenarioAttempt.count({
      where: { userId: user.id, scenarioId },
    })

    const influenceProfile = await recordScenarioAttempt(
      user.id,
      scenarioId,
      selectedResponseId
    )

    // Fetch the newly-created attempt (last one for this user+scenario)
    const attempt = await prisma.userScenarioAttempt.findFirst({
      where: { userId: user.id, scenarioId },
      orderBy: { attemptNumber: "desc" },
    })

    return NextResponse.json({
      attempt,
      selectedResponse,
      influenceProfile,
      isRetake: priorAttemptCount > 0,
    })
  } catch (error) {
    console.error("Scenario attempt error:", error)
    return NextResponse.json(
      { error: "Failed to record attempt." },
      { status: 500 }
    )
  }
}
