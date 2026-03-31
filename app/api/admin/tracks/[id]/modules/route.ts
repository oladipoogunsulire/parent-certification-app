import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: trackId } = await params
  const { moduleTitle, description, beltId, isRequired, isFreePreview, xpValue } = await req.json()

  if (!moduleTitle || !beltId) {
    return NextResponse.json({ error: "Module title and belt are required." }, { status: 400 })
  }

  const existingCount = await prisma.module.count({ where: { trackId } })

  const module = await prisma.module.create({
    data: {
      trackId,
      beltId,
      moduleTitle,
      description,
      isRequired,
      isFreePreview,
      xpValue,
      orderIndex: existingCount + 1,
    },
  })

  return NextResponse.json(module, { status: 201 })
}