import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; resourceId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { lessonId, resourceId } = await params

  // Check subscription (allow free-preview / first-module lessons through)
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, isActive: true },
    include: {
      module: {
        include: { track: true },
      },
    },
  })
  if (!lesson || lesson.module.id !== lesson.moduleId) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const firstModule = await prisma.module.findFirst({
    where: { trackId: lesson.module.trackId, isActive: true },
    orderBy: { orderIndex: "asc" },
    select: { id: true },
  })
  const isFree = lesson.module.isFreePreview || lesson.moduleId === firstModule?.id

  if (!isFree) {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    })
    if (!sub) {
      return NextResponse.json({ error: "Subscription required" }, { status: 403 })
    }
  }

  const resource = await prisma.lessonResource.findUnique({ where: { id: resourceId } })
  if (!resource || resource.lessonId !== lessonId) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  }

  const url = await getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: resource.fileKey,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(resource.fileName)}"`,
    }),
    { expiresIn: 15 * 60 } // 15 minutes
  )

  return NextResponse.redirect(url)
}
