import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
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

  const { moduleId } = await params

  const { beltId, scenarioTitle, narrativeText, videoUrl, complexityLevel, xpValue, isRequired, isActive, responses } =
    await req.json()

  if (!beltId || !narrativeText || !scenarioTitle) {
    return NextResponse.json(
      { error: "Scenario title, belt, and narrative text are required." },
      { status: 400 }
    )
  }

  try {
    const scenario = await prisma.scenario.create({
      data: {
        moduleId,
        beltId,
        scenarioTitle,
        videoUrl: videoUrl || null,
        narrativeText,
        complexityLevel: complexityLevel ?? 1,
        xpValue: xpValue ?? 30,
        isRequired: isRequired ?? true,
        isActive: isActive ?? true,
      },
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
          scenarioId: scenario.id,
          responseText: r.responseText,
          isOptimal: r.isOptimal ?? false,
          scoreImpact: r.scoreImpact ?? 0,
          explanationText: r.explanationText ?? null,
        })),
      })
    }

    return NextResponse.json(scenario, { status: 201 })
  } catch (error) {
    console.error("Create scenario error:", error)
    return NextResponse.json({ error: "Failed to save scenario." }, { status: 500 })
  }
}
