import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { trackName, description, ageBand, expiryDurationMonths } = await req.json()

    if (!trackName) {
      return NextResponse.json({ error: "Module name is required." }, { status: 400 })
    }

    // Create track with default belt structure
    const track = await prisma.track.create({
      data: {
        trackName,
        description,
        ageBand,
        expiryDurationMonths: expiryDurationMonths || 12,
        isActive: false,
        belts: {
          create: [
            { beltLevel: "WHITE", orderIndex: 1, passingThreshold: 75, expirable: false },
            { beltLevel: "YELLOW", orderIndex: 2, passingThreshold: 75, expirable: false },
            { beltLevel: "GREEN", orderIndex: 3, passingThreshold: 75, expirable: false },
            { beltLevel: "BLUE", orderIndex: 4, passingThreshold: 75, expirable: false },
            { beltLevel: "BLACK", orderIndex: 5, passingThreshold: 80, expirable: true },
          ],
        },
      },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (error) {
    console.error("Create track error:", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}