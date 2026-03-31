import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0ebe3] font-sans">

      {/* ── Navbar ── */}
      <header className="bg-white border-b border-[#e8e0d6]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#3c2415] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#1c1209]">Parent Certification</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-[#4a3728] hover:text-[#1c1209]">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-[#3c2415] text-white px-4 py-2 rounded-lg hover:bg-[#2e1b0f] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-bold text-[#1c1209] leading-tight mb-6">
            Become the<br />parent your<br />child deserves
          </h1>
          <p className="text-[#6b5c4e] text-lg leading-relaxed mb-8 max-w-md">
            Structured certification tracks that help you build real parenting skills — at your own pace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="bg-[#3c2415] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2e1b0f] transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/subscribe"
              className="bg-white text-[#1c1209] border border-[#d6cdc3] px-6 py-3 rounded-lg font-medium hover:bg-[#f7f3ef] transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center md:justify-end">
          <div className="w-full max-w-[480px] aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
            {/* Family photo — swap src for your own image */}
            <img
              src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80"
              alt="Happy family together"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-[#1c1209] text-center mb-3">How It Works</h2>
        <p className="text-[#6b5c4e] text-center mb-12">
          A simple three-step journey to becoming a more confident parent
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: "1",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              ),
              title: "Choose your track",
              desc: "Select from specialized parenting tracks designed for your family's unique needs.",
            },
            {
              num: "2",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              ),
              title: "Complete modules",
              desc: "Learn through engaging video lessons, practical exercises, and real-world scenarios.",
            },
            {
              num: "3",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              ),
              title: "Earn your certification",
              desc: "Receive recognized certifications that validate your parenting expertise.",
            },
          ].map((step) => (
            <div key={step.num} className="bg-[#f7f3ef] rounded-2xl p-8 relative">
              <span className="absolute top-5 right-6 text-3xl font-bold text-[#e0d8cf]">{step.num}</span>
              <div className="w-12 h-12 rounded-full bg-[#ede8e0] flex items-center justify-center text-[#4a3728] mb-5">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#1c1209] mb-2">{step.title}</h3>
              <p className="text-[#6b5c4e] text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What You'll Learn ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-[#1c1209] text-center mb-3">What You&apos;ll Learn</h2>
        <p className="text-[#6b5c4e] text-center mb-12">
          Progress through our structured belt system, building skills at each level
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { belt: "White Belt", desc: "Foundations of positive parenting",      bg: "bg-white",        border: "border-gray-200",   title: "text-gray-800",    sub: "text-gray-500" },
            { belt: "Yellow Belt", desc: "Communication & emotional intelligence", bg: "bg-yellow-50",   border: "border-yellow-400", title: "text-yellow-700",  sub: "text-yellow-600" },
            { belt: "Orange Belt", desc: "Discipline strategies & boundaries",     bg: "bg-orange-50",   border: "border-orange-400", title: "text-orange-700",  sub: "text-orange-600" },
            { belt: "Green Belt",  desc: "Building resilience & independence",     bg: "bg-green-50",    border: "border-green-400",  title: "text-green-700",   sub: "text-green-600" },
            { belt: "Blue Belt",   desc: "Advanced conflict resolution",           bg: "bg-blue-50",     border: "border-blue-400",   title: "text-blue-700",    sub: "text-blue-600" },
            { belt: "Black Belt",  desc: "Mastery & mentorship",                   bg: "bg-gray-900",    border: "border-gray-900",   title: "text-white",       sub: "text-gray-400" },
          ].map((item) => (
            <div key={item.belt} className={`${item.bg} border-2 ${item.border} rounded-2xl p-6`}>
              <h3 className={`text-lg font-semibold ${item.title} mb-1`}>{item.belt}</h3>
              <p className={`text-sm ${item.sub}`}>{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[#6b5c4e] text-center mt-10 max-w-2xl mx-auto">
          Each belt includes video lessons, quizzes, practical assignments, and a final assessment to earn your certification.
        </p>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-[#1c1209] mb-4">Affordable Plans for Every Family</h2>
          <p className="text-[#6b5c4e] text-lg mb-8">
            Plans from <span className="font-bold text-[#1c1209]">$29/month</span> — invest in your family&apos;s future today.
          </p>
          <Link
            href="/subscribe"
            className="inline-block border border-[#d6cdc3] text-[#1c1209] px-8 py-3 rounded-lg font-medium hover:bg-[#f7f3ef] transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-[#3c2415] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start your journey?</h2>
          <p className="text-[#c9b9a8] text-lg mb-8">
            Join thousands of parents who are building stronger connections with their children.
          </p>
          <Link
            href="/register"
            className="inline-block border border-[#c9b9a8] text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-[#3c2415] transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1c1209] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#3c2415] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Parent Certification</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-[#9c8878]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/tracks" className="hover:text-white transition-colors">Tracks</Link>
            <Link href="/subscribe" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </nav>
          <p className="text-xs text-[#6b5c4e]">© 2026 Parent Certification. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
