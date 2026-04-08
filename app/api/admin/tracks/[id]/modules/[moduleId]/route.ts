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
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { moduleId } = await params
  const { moduleTitle, description, introVideoUrl } = await req.json()

  if (!moduleTitle?.trim()) {
    return NextResponse.json({ error: "Module title is required." }, { status: 400 })
  }

  try {
    const module = await prisma.module.update({
      where: { id: moduleId },
      data: {
        moduleTitle: moduleTitle.trim(),
        description: description?.trim() || null,
        introVideoUrl: introVideoUrl?.trim() || null,
      },
    })
    return NextResponse.json(module)
  } catch (error) {
    console.error("Update module error:", error)
    return NextResponse.json({ error: "Failed to update module." }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { moduleId } = await params

  try {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    })
    const lessonIds = lessons.map((l) => l.id)

    const scenarios = await prisma.scenario.findMany({
      where: { moduleId },
      select: { id: true },
    })
    const scenarioIds = scenarios.map((s) => s.id)

    await prisma.xPTransaction.deleteMany({
      where: { sourceId: { in: lessonIds }, sourceType: "LESSON" },
    })
    await prisma.scenarioResponse.deleteMany({
      where: { scenarioId: { in: scenarioIds } },
    })
    await prisma.scenario.deleteMany({ where: { moduleId } })
    await prisma.lesson.deleteMany({ where: { moduleId } })
    await prisma.cERecord.deleteMany({ where: { moduleId } })
    await prisma.module.delete({ where: { id: moduleId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete module error:", error)
    return NextResponse.json({ error: "Failed to delete module." }, { status: 500 })
  }
}
