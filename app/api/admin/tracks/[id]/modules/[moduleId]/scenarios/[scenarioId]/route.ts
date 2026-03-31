import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

async function adminGuard() {
  const session = await auth()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
  if (!user || user.role !== "ADMIN") return null
  return user
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; scenarioId: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { scenarioId } = await params

  try {
    await prisma.scenarioResponse.deleteMany({ where: { scenarioId } })
    await prisma.scenario.delete({ where: { id: scenarioId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete scenario error:", error)
    return NextResponse.json({ error: "Failed to delete scenario." }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; scenarioId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { scenarioId } = await params

  const { beltId, scenarioTitle, narrativeText, complexityLevel, xpValue, isRequired, responses } =
    await req.json()

  if (!beltId || !narrativeText || !scenarioTitle) {
    return NextResponse.json(
      { error: "Scenario title, belt, and narrative text are required." },
      { status: 400 }
    )
  }

  try {
    const scenario = await prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        beltId,
        scenarioTitle,
        narrativeText,
        complexityLevel: complexityLevel ?? 1,
        xpValue: xpValue ?? 30,
        isRequired: isRequired ?? true,
      },
    })

    // Replace all responses: delete existing then recreate
    await prisma.scenarioResponse.deleteMany({
      where: { scenarioId },
    })

    const validResponses = (responses ?? []).filter(
      (r: { responseText?: string }) => r.responseText?.trim()
    )

    if (validResponses.length > 0) {
      await prisma.scenarioResponse.createMany({
        data: validResponses.map((r: {
          responseText: string
          isOptimal?: boolean
          scoreImpact?: number
          explanationText?: string
        }) => ({
          scenarioId,
          responseText: r.responseText,
          isOptimal: r.isOptimal ?? false,
          scoreImpact: r.scoreImpact ?? 0,
          explanationText: r.explanationText ?? null,
        })),
      })
    }

    return NextResponse.json(scenario)
  } catch (error) {
    console.error("Update scenario error:", error)
    return NextResponse.json({ error: "Failed to update scenario." }, { status: 500 })
  }
}
