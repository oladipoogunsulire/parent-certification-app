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

export async function GET() {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let config = await prisma.examConfiguration.findFirst()

  if (!config) {
    config = await prisma.examConfiguration.create({
      data: {
        isEnabled: false,
        passingThreshold: 90,
        totalQuestions: 40,
        isTimed: true,
        timeLimitMinutes: 45,
        easyPercent: 40,
        mediumPercent: 40,
        hardPercent: 20,
        randomiseQuestions: true,
        randomiseOptions: true,
        certificateSignatory: "Dr. Tilis",
      },
    })
  }

  return NextResponse.json(config)
}

export async function PATCH(req: NextRequest) {
  const admin = await adminGuard()
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const {
    isEnabled,
    passingThreshold,
    totalQuestions,
    isTimed,
    timeLimitMinutes,
    easyPercent,
    mediumPercent,
    hardPercent,
    randomiseQuestions,
    randomiseOptions,
    certificateSignatory,
  } = body

  const easy = Number(easyPercent)
  const medium = Number(mediumPercent)
  const hard = Number(hardPercent)
  if (easy + medium + hard !== 100) {
    return NextResponse.json(
      { error: `Difficulty percentages must add up to 100% (currently ${easy + medium + hard}%)` },
      { status: 400 }
    )
  }

  if (!certificateSignatory?.trim()) {
    return NextResponse.json({ error: "Certificate signatory is required" }, { status: 400 })
  }

  let config = await prisma.examConfiguration.findFirst()

  if (!config) {
    config = await prisma.examConfiguration.create({
      data: {
        isEnabled: Boolean(isEnabled),
        passingThreshold: Number(passingThreshold),
        totalQuestions: Number(totalQuestions),
        isTimed: Boolean(isTimed),
        timeLimitMinutes: Number(timeLimitMinutes),
        easyPercent: easy,
        mediumPercent: medium,
        hardPercent: hard,
        randomiseQuestions: Boolean(randomiseQuestions),
        randomiseOptions: Boolean(randomiseOptions),
        certificateSignatory: certificateSignatory.trim(),
      },
    })
  } else {
    config = await prisma.examConfiguration.update({
      where: { id: config.id },
      data: {
        isEnabled: Boolean(isEnabled),
        passingThreshold: Number(passingThreshold),
        totalQuestions: Number(totalQuestions),
        isTimed: Boolean(isTimed),
        timeLimitMinutes: Number(timeLimitMinutes),
        easyPercent: easy,
        mediumPercent: medium,
        hardPercent: hard,
        randomiseQuestions: Boolean(randomiseQuestions),
        randomiseOptions: Boolean(randomiseOptions),
        certificateSignatory: certificateSignatory.trim(),
      },
    })
  }

  return NextResponse.json(config)
}
