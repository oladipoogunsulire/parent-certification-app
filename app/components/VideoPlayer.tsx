"use client"

import { getEmbedUrl } from "@/lib/video"

interface Props {
  url: string
  title?: string
}

/**
 * Responsive 16:9 iframe video player.
 * Supports YouTube, Vimeo and Synthesia embed URLs.
 * Renders nothing if the URL is unrecognised.
 */
export default function VideoPlayer({ url, title = "Video" }: Props) {
  const embedUrl = getEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
