import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditLessonForm from "./EditLessonForm"

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>
}) {
  const { id: trackId, moduleId, lessonId } = await params

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: {
        orderBy: { uploadedAt: "asc" },
      },
    },
  })

  if (!lesson || lesson.moduleId !== moduleId) notFound()

  return (
    <EditLessonForm
      trackId={trackId}
      moduleId={moduleId}
      lessonId={lessonId}
      initial={{
        lessonTitle: lesson.lessonTitle,
        introVideoUrl: lesson.introVideoUrl ?? "",
        mainVideoUrl: lesson.mainVideoUrl ?? "",
        contentBody: lesson.contentBody,
        reflectionPrompt: lesson.reflectionPrompt ?? "",
        estimatedDurationMinutes: lesson.estimatedDurationMinutes ?? 10,
        xpValue: lesson.xpValue,
      }}
      initialResources={lesson.resources.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        fileSize: r.fileSize,
        mimeType: r.mimeType,
        uploadedAt: r.uploadedAt.toISOString(),
      }))}
    />
  )
}
