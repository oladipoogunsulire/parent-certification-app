"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  userId:          string
  recipientName:   string
  issuedAt:        string   // e.g. "April 18, 2026"
  score:           number
  certificateCode: string
  signatory:       string
  /** Whether the current session user owns this certificate (enables PDF download) */
  isOwner:         boolean
}

// ---------------------------------------------------------------------------
// CertificateView
// ---------------------------------------------------------------------------

export default function CertificateView({
  userId,
  recipientName,
  issuedAt,
  score,
  certificateCode,
  signatory,
  isOwner,
}: Props) {
  const [downloading, setDownloading] = useState(false)
  const [dlError, setDlError]         = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)

  // ── Print ──────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print()
  }

  // ── PDF Download ───────────────────────────────────────────────────────────
  async function handleDownload() {
    setDownloading(true)
    setDlError(null)
    try {
      const res = await fetch(`/api/certificate/${userId}/download`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? "Failed to generate PDF")
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = "ultimate-influencer-certificate.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setDlError(err instanceof Error ? err.message : "Download failed")
    } finally {
      setDownloading(false)
    }
  }

  // ── Share (copy URL) ───────────────────────────────────────────────────────
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for browsers without clipboard API
      const input   = document.createElement("input")
      input.value   = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const shortCode = certificateCode.slice(0, 12).toUpperCase()

  return (
    <>
      {/* ── Print styles ─────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
          @page { size: A4 landscape; margin: 0; }
          .cert-page-wrapper {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            padding: 0 !important; margin: 0 !important;
            display: flex !important;
            align-items: center !important; justify-content: center !important;
          }
          .cert-outer {
            width: 100% !important; height: 100% !important;
            max-width: none !important; max-height: none !important;
            aspect-ratio: auto !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* ── Action bar (hidden when printing) ────────────────────────────── */}
      <div className="no-print bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <a
            href="/exam"
            className="text-sm text-[#1E3A5F] hover:underline flex items-center gap-1"
          >
            ← Back to exam
          </a>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Share */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-foreground/70"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                  Share
                </>
              )}
            </button>

            {/* Download PDF (owner only) */}
            {isOwner && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-sm border border-[#1E3A5F] text-[#1E3A5F] rounded-lg hover:bg-[#1E3A5F]/5 disabled:opacity-50 transition-colors"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            )}

            {/* Print */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-4 py-1.5 text-sm bg-[#1E3A5F] text-white rounded-lg hover:bg-[#162d4a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print
            </button>
          </div>
        </div>

        {dlError && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-xs text-red-700">
            {dlError}
          </div>
        )}
      </div>

      {/* ── Certificate display area ──────────────────────────────────────── */}
      <div className="cert-page-wrapper bg-gray-100 min-h-[calc(100vh-57px)] flex items-start sm:items-center justify-center px-2 py-6 sm:py-10">
        {/* Outer frame — A4 landscape proportions */}
        <div
          className="cert-outer bg-white shadow-2xl w-full max-w-[900px]"
          style={{ aspectRatio: "297 / 210" }}
        >
          {/* Thick outer border */}
          <div
            className="w-full h-full flex flex-col p-[14px]"
            style={{ boxSizing: "border-box" }}
          >
            <div
              className="flex-1 flex flex-col"
              style={{ border: "7px solid #1E3A5F" }}
            >
              {/* Thin inner border */}
              <div
                className="flex-1 m-[6px] flex flex-col items-center justify-center px-[5%] py-[2%] text-center"
                style={{
                  border:          "1.5px solid #1E3A5F",
                  backgroundColor: "#F9F7F2",
                }}
              >
                {/* Logo */}
                <h1 className="font-extrabold tracking-tight text-[#1E3A5F]"
                    style={{ fontSize: "clamp(14px, 2.8vw, 26px)", letterSpacing: "0.05em" }}>
                  The Ultimate Influencer™
                </h1>
                <p className="uppercase tracking-[0.25em] text-[#1E3A5F]"
                   style={{ fontSize: "clamp(6px, 1vw, 9px)", marginTop: "2px" }}>
                  Premium Preventive Parenting Platform
                </p>

                {/* Top divider */}
                <div className="w-1/2 border-t border-[#1E3A5F]/30 my-[1.5%]" />

                {/* Certification text */}
                <p className="italic text-gray-500" style={{ fontSize: "clamp(8px, 1.3vw, 12px)" }}>
                  This certifies that
                </p>

                <p className="font-extrabold text-[#F97316] leading-none"
                   style={{ fontSize: "clamp(18px, 4vw, 38px)", marginTop: "1%", marginBottom: "1%" }}>
                  {recipientName}
                </p>

                <p className="text-gray-600" style={{ fontSize: "clamp(7px, 1.2vw, 11px)" }}>
                  has successfully demonstrated mastery of
                </p>
                <p className="font-bold text-[#1E3A5F]"
                   style={{ fontSize: "clamp(9px, 1.5vw, 14px)", marginTop: "1%" }}>
                  The Ultimate Influencer™ Curriculum
                </p>
                <p className="text-gray-600" style={{ fontSize: "clamp(7px, 1.2vw, 11px)", marginTop: "1%" }}>
                  and is hereby awarded the designation of
                </p>
                <p className="font-extrabold text-[#1E3A5F]"
                   style={{ fontSize: "clamp(14px, 2.5vw, 24px)", marginTop: "1%", letterSpacing: "0.03em" }}>
                  Certified Ultimate Influencer™
                </p>

                {/* Middle divider */}
                <div className="w-2/3 border-t border-[#1E3A5F]/30 my-[2%]" />

                {/* Details row */}
                <div className="flex items-start justify-center gap-[6%] w-full mb-[2%]">
                  <div className="text-center">
                    <p className="uppercase tracking-widest text-gray-400"
                       style={{ fontSize: "clamp(5px, 0.8vw, 7px)" }}>Date Issued</p>
                    <p className="font-semibold text-[#1E3A5F]"
                       style={{ fontSize: "clamp(7px, 1.1vw, 10px)", marginTop: "2px" }}>
                      {issuedAt}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="uppercase tracking-widest text-gray-400"
                       style={{ fontSize: "clamp(5px, 0.8vw, 7px)" }}>Score Achieved</p>
                    <p className="font-semibold text-[#1E3A5F]"
                       style={{ fontSize: "clamp(7px, 1.1vw, 10px)", marginTop: "2px" }}>
                      {Math.round(score)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="uppercase tracking-widest text-gray-400"
                       style={{ fontSize: "clamp(5px, 0.8vw, 7px)" }}>Certificate ID</p>
                    <p className="font-mono text-gray-500"
                       style={{ fontSize: "clamp(6px, 0.9vw, 8px)", marginTop: "2px" }}>
                      #{shortCode}
                    </p>
                  </div>
                </div>

                {/* Signature divider */}
                <div className="w-2/5 border-t border-[#1E3A5F]/40" style={{ marginBottom: "1%" }} />

                {/* Signature */}
                <div className="text-center">
                  <p className="italic font-semibold text-[#1E3A5F]"
                     style={{ fontFamily: "Georgia, serif", fontSize: "clamp(10px, 1.6vw, 15px)" }}>
                    {signatory}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: "clamp(6px, 0.9vw, 8px)", marginTop: "1px" }}>
                    Child Development Expert &amp; Founder
                  </p>
                </div>

                {/* Footer wordmark */}
                <p className="uppercase tracking-[0.3em] text-gray-300 mt-[2%]"
                   style={{ fontSize: "clamp(5px, 0.7vw, 7px)" }}>
                  The Ultimate Influencer™ · Certified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
