"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: {
  firstName: string
  lastName: string
}) {
  const session = await auth()
  if (!session?.user?.email) {
    return { error: "Not authenticated." }
  }

  const firstName = data.firstName.trim()
  const lastName = data.lastName.trim()

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." }
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
      },
    })

    revalidatePath("/profile")
    return { success: true }
  } catch {
    return { error: "Something went wrong. Please try again." }
  }
}
