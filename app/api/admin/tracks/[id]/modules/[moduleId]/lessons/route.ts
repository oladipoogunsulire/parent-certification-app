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

  const resolvedParams = await params
  const moduleId = resolvedParams.moduleId

  const { lessonTitle, contentBody, reflectionPrompt, estimatedDurationMinutes, xpValue } = await req.json()

  if (!lessonTitle || !contentBody) {
    return NextResponse.json({ error: "Title and content are required." }, { status: 400 })
  }

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      lessonTitle,
      contentBody,
      reflectionPrompt,
      estimatedDurationMinutes,
      xpValue,
    },
  })

  return NextResponse.json(lesson, { status: 201 })
}