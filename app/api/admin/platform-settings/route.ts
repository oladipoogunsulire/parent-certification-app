import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  DEFAULT_INFLUENCE_SCORE_LABELS,
  type InfluenceScoreLabels,
  type PlatformSettingsData,
} from "@/lib/types/platform-settings"

const SCORE_KEYS = ["10", "7", "5", "3"] as const

function isValidLabels(obj: unknown): obj is InfluenceScoreLabels {
  if (!obj || typeof obj !== "object") return false
  return SCORE_KEYS.every(
    (k) => k in (obj as Record<string, unknown>) && typeof (obj as Record<string, unknown>)[k] === "string" && ((obj as Record<string, unknown>)[k] as string).trim().length > 0
  )
}

// GET /api/admin/platform-settings
// No auth required — labels are needed on user-facing scenario UI
export async function GET(): Promise<NextResponse<PlatformSettingsData>> {
  try {
    const row = await prisma.platformSettings.findFirst()
    const labels = row?.influenceScoreLabels as InfluenceScoreLabels | null

    return NextResponse.json({
      influenceScoreLabels: labels ?? DEFAULT_INFLUENCE_SCORE_LABELS,
    })
  } catch {
    return NextResponse.json({
      influenceScoreLabels: DEFAULT_INFLUENCE_SCORE_LABELS,
    })
  }
}

// PATCH /api/admin/platform-settings
// Requires ADMIN role
export async function PATCH(
  req: NextRequest
): Promise<NextResponse<PlatformSettingsData | { error: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }

    const { influenceScoreLabels } = body as { influenceScoreLabels?: unknown }

    if (!isValidLabels(influenceScoreLabels)) {
      return NextResponse.json(
        { error: "influenceScoreLabels must contain non-empty strings for keys: 10, 7, 5, 3." },
        { status: 400 }
      )
    }

    const existing = await prisma.platformSettings.findFirst()

    const labelsJson = influenceScoreLabels as unknown as Record<string, string>

    const updated = existing
      ? await prisma.platformSettings.update({
          where: { id: existing.id },
          data: { influenceScoreLabels: labelsJson },
        })
      : await prisma.platformSettings.create({
          data: { influenceScoreLabels: labelsJson },
        })

    return NextResponse.json({
      influenceScoreLabels: updated.influenceScoreLabels as unknown as InfluenceScoreLabels,
    })
  } catch (err) {
    console.error("[PATCH /api/admin/platform-settings]", err)
    return NextResponse.json({ error: "Internal server error." }, { status: 500 })
  }
}
