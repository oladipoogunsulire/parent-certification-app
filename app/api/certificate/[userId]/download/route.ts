import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { createElement, type ReactElement } from "react"
import CertificatePDF from "@/app/certificate/[userId]/CertificatePDF"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day:   "numeric",
    year:  "numeric",
  })
}

function buildName(
  displayName: string | null,
  name: string | null,
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  if (displayName) return displayName
  const full = [firstName, lastName].filter(Boolean).join(" ").trim()
  if (full) return full
  if (name) return name
  return email.split("@")[0]
}

// ---------------------------------------------------------------------------
// GET /api/certificate/[userId]/download
// Auth-restricted: only the certificate owner can download
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId } = await params

  // Resolve session user
  const sessionUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  })
  if (!sessionUser) {
    return NextResponse.json({ error: "User not found" }, { status: 401 })
  }

  // Only the certificate owner can download their own PDF
  if (sessionUser.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Fetch certificate + user + config
  const [certificate, user, examConfig] = await Promise.all([
    prisma.examCertificate.findUnique({
      where: { userId },
      select: {
        certificateCode: true,
        issuedAt:        true,
        score:           true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        name:        true,
        firstName:   true,
        lastName:    true,
        email:       true,
      },
    }),
    prisma.examConfiguration.findFirst({
      select: { certificateSignatory: true },
    }),
  ])

  if (!certificate || !user) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
  }

  const recipientName = buildName(
    user.displayName,
    user.name,
    user.firstName,
    user.lastName,
    user.email
  )
  const signatory = examConfig?.certificateSignatory ?? "Dr. Tilis"

  // Generate PDF
  try {
    // Cast needed: createElement returns FunctionComponentElement<Props>
    // but renderToBuffer expects ReactElement<DocumentProps>
    const element = createElement(CertificatePDF, {
      recipientName,
      issuedAt:        formatDate(certificate.issuedAt),
      score:           certificate.score,
      certificateCode: certificate.certificateCode,
      signatory,
    }) as unknown as ReactElement<DocumentProps>

    const pdfBuffer = await renderToBuffer(element)

    // Uint8Array is a valid BodyInit; Buffer<ArrayBufferLike> needs explicit cast
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": 'attachment; filename="ultimate-influencer-certificate.pdf"',
        "Cache-Control":       "private, no-store",
      },
    })
  } catch (err) {
    console.error("PDF generation error:", err)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
