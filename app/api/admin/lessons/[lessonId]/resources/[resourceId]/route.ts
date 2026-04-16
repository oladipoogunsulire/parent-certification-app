import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string; resourceId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { lessonId, resourceId } = await params

  const resource = await prisma.lessonResource.findUnique({ where: { id: resourceId } })
  if (!resource || resource.lessonId !== lessonId) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  }

  // Delete from R2
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: resource.fileKey,
    })
  )

  await prisma.lessonResource.delete({ where: { id: resourceId } })

  return NextResponse.json({ success: true })
}
