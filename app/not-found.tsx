import Image from "next/image"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-8">
        <Image
          src="/image/logo-horizontal.png"
          alt="The Ultimate Influencer™"
          width={192}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
      </Link>

      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-3">Page not found</h2>
      <p className="text-foreground/60 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  )
}
