import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import CertificateView from "./CertificateView"

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
// Page — publicly viewable, no auth required for viewing
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const cert = await prisma.examCertificate.findUnique({
    where: { userId },
    select: { userId: true },
  })
  if (!cert) return { title: "Certificate Not Found — The Ultimate Influencer™" }
  return { title: "Certified Ultimate Influencer™ — The Ultimate Influencer™" }
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  // Fetch certificate, user details, and exam config in parallel
  const [certificate, user, examConfig, session] = await Promise.all([
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
    auth(),
  ])

  // 404-style page if no certificate exists
  if (!certificate || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4" aria-hidden>🎓</div>
          <h1 className="text-xl font-bold text-[#1E3A5F] mb-2">
            No certificate found
          </h1>
          <p className="text-sm text-foreground/60 mb-6">
            No Black Belt certificate has been issued for this user yet.
          </p>
          <a
            href="/modules"
            className="inline-flex items-center justify-center min-h-[44px] bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold text-sm px-5 rounded-xl transition-colors"
          >
            Go to Modules
          </a>
        </div>
      </div>
    )
  }

  const recipientName = buildName(
    user.displayName,
    user.name,
    user.firstName,
    user.lastName,
    user.email
  )
  const signatory = examConfig?.certificateSignatory ?? "Dr. Tilis"

  // Determine if the viewer is the owner (enables PDF download)
  let isOwner = false
  if (session?.user?.email) {
    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    isOwner = sessionUser?.id === userId
  }

  return (
    <CertificateView
      userId={userId}
      recipientName={recipientName}
      issuedAt={formatDate(certificate.issuedAt)}
      score={certificate.score}
      certificateCode={certificate.certificateCode}
      signatory={signatory}
      isOwner={isOwner}
    />
  )
}
