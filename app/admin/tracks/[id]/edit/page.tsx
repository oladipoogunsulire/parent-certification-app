import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditTrackForm from "./EditTrackForm"

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const track = await prisma.track.findUnique({ where: { id } })
  if (!track) notFound()

  return (
    <EditTrackForm
      trackId={track.id}
      initial={{
        trackName: track.trackName,
        description: track.description ?? "",
        ageBand: track.ageBand ?? "",
        curriculumVersion: track.curriculumVersion,
        expiryDurationMonths: track.expiryDurationMonths,
        renewalModelType: track.renewalModelType,
        isActive: track.isActive,
      }}
    />
  )
}
