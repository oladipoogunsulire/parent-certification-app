import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { moduleId } = await params

  const { beltId, narrativeText, complexityLevel, xpValue, isRequired, responses } =
    await req.json()

  if (!beltId || !narrativeText) {
    return NextResponse.json(
      { error: "Belt and narrative text are required." },
      { status: 400 }
    )
  }

  const scenario = await prisma.$transaction(async (tx) => {
    const created = await tx.scenario.create({
      data: {
        moduleId,
        beltId,
        narrativeText,
        complexityLevel: complexityLevel ?? 1,
        xpValue: xpValue ?? 30,
        isRequired: isRequired ?? true,
      },
    })

    const validResponses = (responses ?? []).filter(
      (r: { responseText?: string }) => r.responseText?.trim()
    )

    if (validResponses.length > 0) {
      await tx.scenarioResponse.createMany({
        data: validResponses.map((r: {
          responseText: string
          isOptimal?: boolean
          scoreImpact?: number
          explanationText?: string
        }) => ({
          scenarioId: created.id,
          responseText: r.responseText,
          isOptimal: r.isOptimal ?? false,
          scoreImpact: r.scoreImpact ?? 0,
          explanationText: r.explanationText ?? null,
        })),
      })
    }

    return created
  })

  return NextResponse.json(scenario, { status: 201 })
}
