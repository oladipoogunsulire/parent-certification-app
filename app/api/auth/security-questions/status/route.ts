import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const record = await prisma.userSecurityQuestion.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    return NextResponse.json({ hasSecurityQuestions: !!record })
  } catch (error) {
    console.error("Security questions status error:", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
