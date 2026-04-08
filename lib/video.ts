/**
 * Converts a user-pasted video URL into an embeddable iframe src.
 * Supports YouTube, Vimeo, and Synthesia.
 * Returns null for unrecognised or invalid URLs.
 */
export function getEmbedUrl(url: string): string | null {
  if (!url?.trim()) return null

  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, "")

    // ── YouTube ───────────────────────────────────────────────────
    if (host === "youtube.com") {
      // Already an embed URL
      if (u.pathname.startsWith("/embed/")) return url
      // Standard watch URL: youtube.com/watch?v=VIDEO_ID
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    // Short URL: youtu.be/VIDEO_ID
    if (host === "youtu.be") {
      const v = u.pathname.slice(1).split("?")[0]
      if (v) return `https://www.youtube.com/embed/${v}`
    }

    // ── Vimeo ─────────────────────────────────────────────────────
    if (host === "vimeo.com") {
      // Standard URL: vimeo.com/VIDEO_ID
      const v = u.pathname.replace(/^\//, "").split("/")[0]
      if (/^\d+$/.test(v)) return `https://player.vimeo.com/video/${v}`
    }
    if (host === "player.vimeo.com") return url // already embed

    // ── Synthesia ─────────────────────────────────────────────────
    if (host.includes("synthesia.io")) return url

    return null
  } catch {
    return null
  }
}
