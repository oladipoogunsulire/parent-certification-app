"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Upserts a UserLessonProgress record.
 * Call with markCompleted=false to record a visit, or markCompleted=true to mark lesson done.
 */
export async function updateLessonProgress(
  lessonId: string,
  markCompleted: boolean = false
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  const userId = session.user.id

  try {
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        lastVisitedAt: new Date(),
        ...(markCompleted ? { completed: true, completedAt: new Date() } : {}),
      },
      create: {
        userId,
        lessonId,
        lastVisitedAt: new Date(),
        completed: markCompleted,
        completedAt: markCompleted ? new Date() : null,
      },
    })

    revalidatePath("/tracks", "layout")
    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Something went wrong." }
  }
}
