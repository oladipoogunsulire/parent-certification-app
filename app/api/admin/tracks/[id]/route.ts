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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: trackId } = await params

  try {
    const body = await req.json()
    const {
      trackName,
      description,
      ageBand,
      curriculumVersion,
      expiryDurationMonths,
      renewalModelType,
      isActive,
    } = body

    if (!trackName?.trim()) {
      return NextResponse.json({ error: "Track name is required." }, { status: 400 })
    }

    const track = await prisma.track.update({
      where: { id: trackId },
      data: {
        trackName: trackName.trim(),
        description: description ?? null,
        ageBand: ageBand || null,
        curriculumVersion: curriculumVersion || "1.0",
        expiryDurationMonths: Number(expiryDurationMonths) || 12,
        renewalModelType: renewalModelType || "EXAM_ONLY",
        isActive: Boolean(isActive),
      },
    })

    return NextResponse.json(track)
  } catch (error) {
    console.error("Update track error:", error)
    return NextResponse.json({ error: "Failed to update track." }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: trackId } = await params

  try {
    // Gather IDs needed for cascade
    const modules = await prisma.module.findMany({ where: { trackId }, select: { id: true } })
    const moduleIds = modules.map((m) => m.id)

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true },
    })
    const lessonIds = lessons.map((l) => l.id)

    const scenarios = await prisma.scenario.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true },
    })
    const scenarioIds = scenarios.map((s) => s.id)

    const questions = await prisma.question.findMany({
      where: { trackId },
      select: { id: true },
    })
    const questionIds = questions.map((q) => q.id)

    const certifications = await prisma.certification.findMany({
      where: { trackId },
      select: { id: true },
    })
    const certIds = certifications.map((c) => c.id)

    // Delete in dependency order
    await prisma.xPTransaction.deleteMany({
      where: { sourceId: { in: lessonIds }, sourceType: "LESSON" },
    })
    await prisma.scenarioResponse.deleteMany({
      where: { scenarioId: { in: scenarioIds } },
    })
    await prisma.scenario.deleteMany({ where: { moduleId: { in: moduleIds } } })
    await prisma.lesson.deleteMany({ where: { moduleId: { in: moduleIds } } })
    await prisma.cERecord.deleteMany({ where: { moduleId: { in: moduleIds } } })
    await prisma.module.deleteMany({ where: { trackId } })
    await prisma.questionOption.deleteMany({
      where: { questionId: { in: questionIds } },
    })
    await prisma.question.deleteMany({ where: { trackId } })
    await prisma.certificationEvent.deleteMany({
      where: { certificationId: { in: certIds } },
    })
    await prisma.certification.deleteMany({ where: { trackId } })
    await prisma.examAttempt.deleteMany({ where: { trackId } })
    await prisma.cERecord.deleteMany({ where: { trackId } })
    await prisma.belt.deleteMany({ where: { trackId } })
    await prisma.track.delete({ where: { id: trackId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete track error:", error)
    return NextResponse.json({ error: "Failed to delete track." }, { status: 500 })
  }
}
