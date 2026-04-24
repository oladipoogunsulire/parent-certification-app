import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — The Ultimate Influencer™",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <nav className="text-sm text-foreground/50">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">→</span>
            <span className="text-foreground/80">Privacy Policy</span>
          </nav>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Privacy Policy</h1>
          <p className="text-sm text-foreground/50">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 text-foreground/80 leading-relaxed">

          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">1. Introduction</h2>
            <p>
              The Ultimate Influencer™ (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates a
              subscription-based online parenting education platform accessible at this website. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you use our
              platform.
            </p>
            <p className="mt-3">
              By creating an account or using our services, you agree to the practices described in this policy.
              If you do not agree, please do not use our platform.
            </p>
            <p className="mt-3">
              This policy applies to all users of The Ultimate Influencer™ platform and is intended to comply
              with applicable Canadian privacy laws, including the Personal Information Protection and Electronic
              Documents Act (PIPEDA).
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">2. Information We Collect</h2>
            <p className="font-medium text-foreground mb-2">Account information</p>
            <p>
              When you register, we collect your first name, last name, and email address. If you register
              using Google, we receive your name and email address from Google as permitted by your Google
              account settings.
            </p>
            <p className="mt-3 font-medium text-foreground mb-2">Payment information</p>
            <p>
              Payments are processed securely by Stripe. We do not store your credit card number, CVV, or
              full payment card details on our servers. We retain only a Stripe customer ID and subscription
              identifier to manage your billing relationship.
            </p>
            <p className="mt-3 font-medium text-foreground mb-2">Learning and progress data</p>
            <p>
              We collect data about your activity on the platform, including lessons completed, scenario
              responses, your Influence Score™, belt progression, and exam results. This data is used to
              deliver and personalise your learning experience.
            </p>
            <p className="mt-3 font-medium text-foreground mb-2">Usage data</p>
            <p>
              We automatically collect certain technical information when you use our platform, including
              your IP address, browser type, device information, pages visited, and session duration.
              This is used for security, platform improvement, and analytics.
            </p>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Deliver and operate the platform, including tracking your learning progress and belt achievements</li>
              <li>Process your subscription payments through Stripe</li>
              <li>Send you transactional emails such as account confirmations and billing receipts</li>
              <li>Respond to your support requests and inquiries</li>
              <li>Improve our platform content, features, and user experience</li>
              <li>Enforce our Terms of Service and protect the security of our platform</li>
              <li>Comply with applicable legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties. We do not use your information for
              behavioural advertising.
            </p>
          </section>

          {/* 4. Data Storage and Security */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored on secure cloud infrastructure. Our database is hosted on Neon (a
              managed PostgreSQL service) and our application is deployed on Vercel&rsquo;s platform.
              Both services employ industry-standard security practices including encryption at rest and
              in transit.
            </p>
            <p className="mt-3">
              We implement appropriate technical and organisational measures to protect your personal
              information against unauthorised access, alteration, disclosure, or destruction. Your
              password is stored using bcrypt hashing and is never stored in plain text.
            </p>
            <p className="mt-3">
              While we take data security seriously, no method of transmission over the internet is
              completely secure. We cannot guarantee absolute security but are committed to protecting
              your data using best practices.
            </p>
          </section>

          {/* 5. Third Party Services */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services to operate the platform:</p>
            <ul className="mt-3 space-y-3">
              <li>
                <span className="font-medium text-foreground">Stripe</span> — Payment processing.
                Stripe handles all credit card transactions. Their privacy policy applies to payment
                data: <span className="text-foreground/60">stripe.com/privacy</span>
              </li>
              <li>
                <span className="font-medium text-foreground">Vercel</span> — Application hosting
                and deployment infrastructure. Your data passes through Vercel&rsquo;s servers when
                you use our platform.
              </li>
              <li>
                <span className="font-medium text-foreground">Neon</span> — Managed PostgreSQL
                database hosting. Your account and progress data is stored in Neon&rsquo;s
                infrastructure.
              </li>
              <li>
                <span className="font-medium text-foreground">Cloudflare</span> — File storage and
                CDN for platform assets such as downloadable lesson resources.
              </li>
              <li>
                <span className="font-medium text-foreground">Google</span> — If you choose to
                sign in with Google, Google shares your name and email address with us as part of
                the OAuth authentication flow.
              </li>
            </ul>
            <p className="mt-3">
              Each of these services has their own privacy policies. We encourage you to review them
              to understand how they handle your data.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">6. Your Rights</h2>
            <p>You have the following rights with respect to your personal information:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>
                <span className="font-medium text-foreground">Access</span> — You may request a
                copy of the personal information we hold about you.
              </li>
              <li>
                <span className="font-medium text-foreground">Correction</span> — You may update
                your account information at any time through your profile settings.
              </li>
              <li>
                <span className="font-medium text-foreground">Deletion</span> — You may request
                that we delete your account and associated personal data. Contact us at the address
                below to submit a deletion request.
              </li>
              <li>
                <span className="font-medium text-foreground">Withdrawal of consent</span> — Where
                processing is based on consent, you may withdraw your consent at any time, though
                this will not affect the lawfulness of processing already carried out.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us using the details in the Contact
              section below. We will respond to your request within 30 days.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">7. Children&rsquo;s Privacy</h2>
            <p>
              The Ultimate Influencer™ is a platform designed for adults — specifically parents and
              caregivers. Our platform is not directed at children under the age of 13 and we do not
              knowingly collect personal information from anyone under 13.
            </p>
            <p className="mt-3">
              If we become aware that we have collected personal information from a child under 13,
              we will take steps to delete that information promptly. If you believe a child under 13
              has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">8. Cookies</h2>
            <p>
              We use essential cookies to operate the platform. These include session cookies that
              keep you signed in while using the platform and security cookies that help protect
              against unauthorised access.
            </p>
            <p className="mt-3">
              We do not use advertising or tracking cookies. The cookies we use are strictly
              necessary for the platform to function and cannot be disabled without preventing you
              from using the service.
            </p>
          </section>

          {/* 9. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time as our platform evolves or legal
              requirements change. When we make material changes, we will notify registered users
              by email or by displaying a notice on the platform.
            </p>
            <p className="mt-3">
              Your continued use of the platform after changes are posted constitutes your
              acceptance of the updated policy. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">10. Contact Us</h2>
            <p>
              For privacy-related inquiries, requests to access or delete your data, or any
              questions about this policy, please contact us at:
            </p>
            <p className="mt-3">
              <a
                href="mailto:privacy@yourdomain.com"
                className="text-primary hover:underline font-medium"
              >
                privacy@yourdomain.com
              </a>
            </p>
          </section>

        </div>

        {/* Back to home */}
        <div className="mt-14 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="text-sm text-primary hover:underline font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
