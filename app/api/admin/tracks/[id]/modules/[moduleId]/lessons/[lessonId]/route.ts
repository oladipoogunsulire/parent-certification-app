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
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lessonId } = await params
  const { lessonTitle, contentBody, reflectionPrompt, introVideoUrl, mainVideoUrl, estimatedDurationMinutes, xpValue } =
    await req.json()

  if (!lessonTitle || !contentBody) {
    return NextResponse.json({ error: "Title and content are required." }, { status: 400 })
  }

  try {
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        lessonTitle,
        contentBody,
        reflectionPrompt,
        introVideoUrl: introVideoUrl || null,
        mainVideoUrl: mainVideoUrl || null,
        estimatedDurationMinutes,
        xpValue,
      },
    })
    return NextResponse.json(lesson)
  } catch (error) {
    console.error("Update lesson error:", error)
    return NextResponse.json({ error: "Failed to update lesson." }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
  const user = await adminGuard()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lessonId } = await params

  try {
    await prisma.xPTransaction.deleteMany({
      where: { sourceId: lessonId, sourceType: "LESSON" },
    })
    await prisma.lesson.delete({ where: { id: lessonId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete lesson error:", error)
    return NextResponse.json({ error: "Failed to delete lesson." }, { status: 500 })
  }
}
