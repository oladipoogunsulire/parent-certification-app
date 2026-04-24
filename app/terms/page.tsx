import Link from "next/link"

export const metadata = {
  title: "Terms of Service — The Ultimate Influencer™",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <nav className="text-sm text-foreground/50">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">→</span>
            <span className="text-foreground/80">Terms of Service</span>
          </nav>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Terms of Service</h1>
          <p className="text-sm text-foreground/50">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 text-foreground/80 leading-relaxed">

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using The Ultimate Influencer™ platform (&ldquo;the Platform&rdquo;, &ldquo;the
              Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you
              do not agree to these Terms, you may not access or use the Platform.
            </p>
            <p className="mt-3">
              These Terms constitute a legally binding agreement between you and The Ultimate Influencer™
              (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). You represent that you are at least
              18 years of age and have the legal capacity to enter into this agreement.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">2. Description of Service</h2>
            <p>
              The Ultimate Influencer™ is a subscription-based online parenting education platform that
              provides parents and caregivers with structured learning modules, scenario-based practice,
              progress tracking, and certification opportunities.
            </p>
            <p className="mt-3">
              The Platform includes the Influence Lab curriculum (White through Black Belt), the DRG™
              Framework (Discipline, Resilience &amp; Grit), the Influence Score™ system, and the Black
              Belt certification exam. Content is delivered through video lessons, written materials,
              interactive scenarios, and downloadable resources.
            </p>
            <p className="mt-3">
              We reserve the right to modify, update, or discontinue any feature or aspect of the Service
              at any time, with reasonable notice to subscribers where changes are material.
            </p>
          </section>

          {/* 3. Account Registration */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">3. Account Registration</h2>
            <p>
              To access the Platform you must create an account. You agree to provide accurate, complete,
              and current information during registration and to keep this information up to date.
            </p>
            <p className="mt-3">
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activity that occurs under your account. You agree to notify us immediately of any
              unauthorised use of your account.
            </p>
            <p className="mt-3">
              You may not create an account on behalf of another person without their authorisation, share
              your account with others, or create multiple accounts.
            </p>
          </section>

          {/* 4. Subscription and Payments */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">4. Subscription and Payments</h2>
            <p>
              Access to the full Platform requires a paid subscription. We offer monthly and annual
              billing plans. Prices are displayed in Canadian dollars (CAD) unless otherwise stated.
            </p>
            <p className="mt-3">
              All payments are processed securely by Stripe. By providing payment information you
              authorise us to charge your payment method for the subscription fee on a recurring basis
              (monthly or annually, depending on your chosen plan).
            </p>
            <p className="mt-3">
              Subscriptions renew automatically at the end of each billing period unless cancelled
              before the renewal date. You will be charged the then-current subscription rate on each
              renewal date. We will notify you of any price changes in advance.
            </p>
            <p className="mt-3">
              Taxes may apply depending on your location. You are responsible for any applicable
              taxes not included in the stated price.
            </p>
          </section>

          {/* 5. Cancellation Policy */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">5. Cancellation Policy</h2>
            <p>
              You may cancel your subscription at any time through your account settings or by
              contacting us. When you cancel, your subscription will not renew at the end of the
              current billing period and you will retain full access to the Platform until that date.
            </p>
            <p className="mt-3">
              We do not provide refunds for partial billing periods or for subscription fees already
              charged. If you cancel mid-period, your access continues until the end of the period
              you have paid for.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms. In
              the event of termination for cause, no refund will be issued.
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">6. Intellectual Property</h2>
            <p>
              All content on the Platform — including but not limited to video lessons, written
              materials, scenario exercises, the DRG™ Framework, the Influence Score™ system,
              curriculum design, graphics, and the The Ultimate Influencer™ name and branding —
              is owned by or licensed to us and is protected by Canadian and international copyright
              and trademark laws.
            </p>
            <p className="mt-3">
              Your subscription grants you a limited, non-exclusive, non-transferable, personal
              licence to access and use Platform content for your own private, non-commercial
              educational purposes only.
            </p>
            <p className="mt-3">
              You may not copy, reproduce, distribute, publish, modify, create derivative works
              from, or commercially exploit any Platform content without our prior written
              permission.
            </p>
          </section>

          {/* 7. User Conduct */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">7. User Conduct</h2>
            <p>By using the Platform you agree that you will not:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Share your account credentials or allow others to access the Platform using your account</li>
              <li>Reproduce, record, or distribute any Platform content in any format</li>
              <li>Use the Platform for any unlawful purpose or in violation of these Terms</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure</li>
              <li>Use automated tools, bots, or scrapers to access Platform content</li>
              <li>Interfere with or disrupt the Platform or its servers</li>
              <li>Impersonate any person or misrepresent your affiliation with any entity</li>
            </ul>
            <p className="mt-3">
              Violation of these conduct rules may result in immediate suspension or termination
              of your account without refund.
            </p>
          </section>

          {/* 8. Disclaimers */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">8. Disclaimers</h2>
            <p>
              The content provided on The Ultimate Influencer™ platform is for general educational
              purposes only. It is not intended to constitute professional psychological, medical,
              legal, or parenting advice and should not be relied upon as such.
            </p>
            <p className="mt-3">
              Results from using the Platform — including improvements in parenting skills or
              child outcomes — will vary based on individual circumstances. We make no guarantees
              regarding specific outcomes.
            </p>
            <p className="mt-3">
              THE PLATFORM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS
              WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
              TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE ULTIMATE INFLUENCER™ AND ITS
              OWNERS, OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO
              YOUR USE OF, OR INABILITY TO USE, THE PLATFORM.
            </p>
            <p className="mt-3">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED
              TO THESE TERMS OR THE PLATFORM EXCEED THE TOTAL AMOUNT YOU PAID TO US IN THE
              TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
            <p className="mt-3">
              Some jurisdictions do not allow the exclusion of certain warranties or limitation of
              liability for certain types of damages. In such jurisdictions, our liability will be
              limited to the greatest extent permitted by law.
            </p>
          </section>

          {/* 10. Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              Province of Ontario and the federal laws of Canada applicable therein, without regard
              to conflict of law principles.
            </p>
            <p className="mt-3">
              Any dispute arising out of or relating to these Terms or the Platform shall be subject
              to the exclusive jurisdiction of the courts of Ontario, Canada. You consent to the
              personal jurisdiction of such courts.
            </p>
          </section>

          {/* 11. Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              notify registered users by email or by displaying a notice on the Platform prior to
              the changes taking effect.
            </p>
            <p className="mt-3">
              Your continued use of the Platform after updated Terms are posted constitutes your
              acceptance of the revised Terms. If you do not agree to the revised Terms, you must
              discontinue use of the Platform and cancel your subscription.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-3">12. Contact Us</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <p className="mt-3">
              <a
                href="mailto:legal@yourdomain.com"
                className="text-primary hover:underline font-medium"
              >
                legal@yourdomain.com
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
