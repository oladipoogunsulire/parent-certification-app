import Link from "next/link"
import Image from "next/image"
import HomeNav from "@/app/components/HomeNav"
import FAQSection from "@/app/components/FAQSection"

// ─── data ─────────────────────────────────────────────────────────────────────

const modules = [
  {
    belt: "WHITE",
    label: "WHITE Belt — Foundation",
    dot: "bg-gray-200 border border-gray-400",
    card: "bg-white border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    items: [
      {
        num: 1,
        title: "Parenting Is Influence Science",
        desc: "Master the core principle: you are your child's most powerful influence.",
      },
    ],
  },
  {
    belt: "YELLOW",
    label: "YELLOW Belt — Early Years",
    dot: "bg-yellow-400",
    card: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800",
    items: [
      {
        num: 2,
        title: "Early Childhood (0–5 Years)",
        desc: "Build the foundation of attachment, wiring and early boundaries.",
      },
    ],
  },
  {
    belt: "GREEN",
    label: "GREEN Belt — Growing Years",
    dot: "bg-green-500",
    card: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800",
    items: [
      {
        num: 3,
        title: "School Age (6–10 Years)",
        desc: "Navigate identity formation, trust building and social coaching.",
      },
    ],
  },
  {
    belt: "BLUE",
    label: "BLUE Belt — Transition Years",
    dot: "bg-blue-500",
    card: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    items: [
      {
        num: 4,
        title: "Preteen (11–13 Years)",
        desc: "Guide your child through one of the most critical developmental transitions.",
      },
      {
        num: 5,
        title: "Teen (14–17 Years)",
        desc: "Support autonomy, identity and the shift toward independence.",
      },
    ],
  },
  {
    belt: "BROWN",
    label: "BROWN Belt — Advanced Influence",
    dot: "bg-amber-600",
    card: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    items: [
      {
        num: 6,
        title: "Discipline, Resilience & Grit (DRG™ Framework)",
        desc: "A dedicated framework for raising children with strength, bounce-back ability and character.",
      },
      {
        num: 7,
        title: "Early Warning Signs",
        desc: "Recognise the signals that require early intervention before patterns become problems.",
      },
      {
        num: 8,
        title: "Consequences: Discipline as Direction",
        desc: "Transform consequences from punishment into powerful teaching moments.",
      },
      {
        num: 9,
        title: "Empathy and Service",
        desc: "Raise children who understand others, contribute meaningfully and lead with compassion.",
      },
    ],
  },
  {
    belt: "BLACK",
    label: "BLACK Belt — Mastery",
    dot: "bg-gray-900",
    card: "bg-gray-900 border-gray-700",
    badge: "bg-white/10 text-white",
    items: [
      {
        num: 10,
        title: "Pre-Parent Young Adults",
        desc: "The integrative module — preparing the next generation to parent with intention before they begin.",
      },
    ],
  },
]

const testimonials = [
  {
    photo: "/image/family-testimonial-2.webp",
    name: "Marcus T.",
    location: "Father of 2, Toronto",
    quote:
      "I always thought I was a good parent. The Influence Score showed me where I was actually losing ground to outside influences. Module 3 changed everything for us.",
  },
  {
    photo: "/image/family-testimonial-3.webp",
    name: "Priya & David S.",
    location: "Parents of 3, Vancouver",
    quote:
      "The scenarios are so realistic. For the first time I could see exactly how my responses were affecting my children's development. The DRG™ Framework is now part of our daily life.",
  },
  {
    photo: "/image/family-testimonial-4.webp",
    name: "Mei L.",
    location: "Mother of 1, Calgary",
    quote:
      "Earning my Yellow Belt felt genuinely meaningful. This isn't just a course — it's a complete shift in how I see my role as a parent. Worth every minute.",
  },
]

const monthlyFeatures = [
  "Full access to all 10 modules",
  "40+ real-life scenarios",
  "Influence Score™ tracking",
  "Belt progression system",
  "Downloadable resources",
  "Black Belt certification exam",
]

const annualFeatures = [
  ...monthlyFeatures,
  "2 months free",
  "Priority support",
]

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background font-sans" style={{ scrollBehavior: "smooth" }}>

      <HomeNav />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col-reverse md:flex-row items-center gap-12">
        {/* Copy */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-tight mb-3">
            You Are Your Child&apos;s Most<br className="hidden sm:block" /> Powerful Influence
          </h1>
          <p className="text-foreground/60 text-base font-medium mb-5 max-w-xl mx-auto md:mx-0">
            The only parenting platform that measures your influence — not just your effort
          </p>
          <p className="text-foreground/70 text-lg leading-relaxed mb-8 max-w-xl mx-auto md:mx-0">
            Most parents react. The best ones lead with intention. The Influence Lab is where you train
            to become the parent your child needs — and the ultimate influence in their life.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-6 w-full">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-accent text-white font-semibold px-7 py-3 rounded-lg hover:bg-accent-hover transition-colors text-center"
            >
              Start Your Journey Free
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto bg-white text-primary border border-primary font-semibold px-7 py-3 rounded-lg hover:bg-primary/5 transition-colors text-center"
            >
              See How It Works
            </a>
          </div>

          <p className="text-sm text-foreground/50 max-w-md mx-auto md:mx-0">
            Join the Premium Preventive Parenting Platform — built for parents who want to lead, not just react.
          </p>
        </div>

        {/* Hero image */}
        <div className="flex-1 w-full">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/image/FAMILYimage.png"
              alt="Family together — parents leading with intention"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ───────────────────────────────────────────────────────── */}
      <section className="bg-primary/5 border-y border-primary/10 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-primary font-medium flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 leading-relaxed">
            <span>🏅 Developed with Child Development Expertise</span>
            <span className="hidden sm:inline text-primary/30">·</span>
            <span>🌍 The Premium Preventive Parenting Platform</span>
            <span className="hidden sm:inline text-primary/30">·</span>
            <span>⭐ Parenting Today. Raising Tomorrow&apos;s Champions.</span>
          </p>
        </div>
      </section>

      {/* ── CREDIBILITY BAR ───────────────────────────────────────────────────── */}
      <section className="bg-[#F8F9FA] border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { stat: "10",  label: "Influence Modules" },
              { stat: "40+", label: "Real-Life Scenarios" },
              { stat: "5",   label: "Belt Levels" },
              { stat: "1",   label: "Certification" },
            ].map((item, i, arr) => (
              <div key={item.label} className="relative text-center">
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-gray-300" />
                )}
                <p className="text-4xl sm:text-5xl font-bold text-primary">{item.stat}</p>
                <p className="text-sm text-foreground/55 mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT IS THE INFLUENCE LAB ─────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-5">
              This Is Not A Course. It&apos;s A Training System.
            </h2>
            <p className="text-foreground/70 text-lg leading-relaxed">
              Traditional parenting content tells you what to do. The Influence Lab trains you to observe,
              decide, act and grow. Through scenario-based modules, real-world challenges and a measurable
              Influence Score, you will develop the skills that shape your child&apos;s character, confidence
              and future — one decision at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Practice-Based Learning",
                desc: "Every module puts you in real parenting situations. You decide. You get feedback. You improve.",
              },
              {
                icon: "📊",
                title: "Measurable Skill Progression",
                desc: "Your Influence Score tracks the quality of your decisions — not just whether you showed up.",
              },
              {
                icon: "🏅",
                title: "Belt-Based Mastery",
                desc: "Progress through White to Black Belt as you complete modules and demonstrate mastery.",
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="bg-background rounded-xl border border-gray-100 p-7 shadow-sm"
              >
                <div className="text-4xl mb-4">{pillar.icon}</div>
                <h3 className="font-bold text-primary text-lg mb-2">{pillar.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-background py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              Your Path to Becoming The Ultimate Influencer™
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Enter The Influence Lab",
                desc: "Choose your first module and begin your parenting influence journey. No overwhelm — just one focused topic at a time.",
              },
              {
                step: "2",
                title: "Train Through Real Scenarios",
                desc: "Every module puts you in real parenting situations. You decide. You receive feedback. You grow. This is not reading — it is practice.",
              },
              {
                step: "3",
                title: "Earn Your Influence Score",
                desc: "As you complete modules and scenarios, your Influence Score grows. Watch yourself progress from Reactive Parent all the way to Ultimate Influencer™.",
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <span className="absolute top-5 right-6 text-5xl font-bold text-gray-100 select-none leading-none">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                  <span className="text-accent font-bold text-sm">{item.step}</span>
                </div>
                <h3 className="font-bold text-primary text-xl mb-3">{item.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              What Parents Are Saying
            </h2>
            <p className="text-foreground/60 text-lg">
              Join families who are transforming their parenting approach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center"
              >
                <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 shrink-0">
                  <Image
                    src={t.photo}
                    alt={t.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="text-[#F97316] text-lg mb-3 tracking-wide">★★★★★</div>
                <p className="text-foreground/70 text-sm leading-relaxed italic mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="font-bold text-foreground text-sm">{t.name}</p>
                <p className="text-foreground/50 text-xs mt-0.5">{t.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFLUENCE SCORE ───────────────────────────────────────────────────── */}
      <section className="bg-background py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-5">
            Where Are You On Your Influence Journey?
          </h2>
          <p className="text-foreground/70 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
            Your Influence Score measures the quality of your parenting decisions — not just whether you
            finished a module. Every scenario you complete moves you forward.
          </p>

          {/* Progression row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 mb-10">
            {[
              { emoji: "🔴", label: "Reactive Parent",    bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700" },
              { emoji: "🟡", label: "Developing Parent",  bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
              { emoji: "🟢", label: "Intentional Parent", bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
              { emoji: "⭐", label: "Ultimate Influencer™", bg: "bg-primary/5", border: "border-primary/20", text: "text-primary" },
            ].map((level, i, arr) => (
              <div key={level.label} className="flex items-center">
                <div className={`${level.bg} border ${level.border} rounded-xl px-5 py-4 text-center min-w-[148px]`}>
                  <div className="text-3xl mb-1">{level.emoji}</div>
                  <p className={`text-sm font-semibold ${level.text}`}>{level.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block text-gray-300 mx-2 text-xl font-light select-none">→</div>
                )}
              </div>
            ))}
          </div>

          <p className="text-foreground/60 text-base max-w-2xl mx-auto">
            Every decision you make in the Influence Lab shapes the parent you are becoming.
            Where will you be in 30 days?
          </p>
        </div>
      </section>

      {/* ── DRG™ FRAMEWORK ────────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">Core Curriculum</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Introducing the DRG™ Framework
          </h2>
          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Discipline. Resilience. Grit. Developed as a core pillar of the Influence Lab curriculum,
            the DRG™ Framework gives parents a practical, proven approach to raising children with
            strength, bounce-back ability and character that lasts a lifetime. It is not about punishment.
            It is about direction.
          </p>
          <Link
            href="/tracks"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline text-base"
          >
            Explore the DRG™ Framework →
          </Link>
        </div>
      </section>

      {/* ── THE MODULES ───────────────────────────────────────────────────────── */}
      <section className="bg-background py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              Ten Modules. One Transformation.
            </h2>
            <p className="text-foreground/60 max-w-2xl mx-auto text-base leading-relaxed">
              Each module focuses on a critical dimension of parenting influence — from your child&apos;s
              earliest years to young adulthood. Progress through the belts as you complete each stage.
            </p>
          </div>

          <div className="space-y-6 mt-12">
            {modules.map((belt) => (
              <div key={belt.belt} className={`rounded-2xl border ${belt.card} overflow-hidden`}>
                {/* Belt header */}
                <div className={`px-6 py-4 flex items-center gap-3 border-b ${belt.belt === "BLACK" ? "border-gray-700" : "border-inherit"}`}>
                  <div className={`w-5 h-5 rounded-full shrink-0 ${belt.dot}`} />
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${belt.belt === "BLACK" ? "text-white" : "text-foreground"}`}>
                    {belt.label}
                  </h3>
                </div>

                {/* Module items */}
                <div className={`divide-y ${belt.belt === "BLACK" ? "divide-gray-700" : "divide-gray-100"}`}>
                  {belt.items.map((mod) => (
                    <div key={mod.num} className="px-6 py-5 flex items-start gap-4">
                      <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full mt-0.5 ${belt.badge}`}>
                        {mod.num < 10 ? `0${mod.num}` : mod.num}
                      </span>
                      <div>
                        <p className={`font-semibold text-base ${belt.belt === "BLACK" ? "text-white" : "text-foreground"}`}>
                          {mod.title}
                        </p>
                        <p className={`text-sm mt-1 leading-relaxed ${belt.belt === "BLACK" ? "text-white/60" : "text-foreground/55"}`}>
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-foreground/60 text-sm mt-10 max-w-3xl mx-auto leading-relaxed">
            Every module includes video lessons, real-world scenarios, downloadable resources and progress
            tracking. Complete all ten and earn your Black Belt — the mark of The Ultimate Influencer™.
          </p>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-foreground/60 text-lg">Invest in your most important relationship</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Monthly */}
            <div className="bg-white border-2 border-primary rounded-2xl p-8 flex flex-col">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Monthly</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-primary">$29</span>
                <span className="text-foreground/50 text-base ml-1">/month</span>
              </div>
              <p className="text-sm text-foreground/50 mb-6">Cancel anytime</p>
              <ul className="space-y-3 mb-8 flex-1">
                {monthlyFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Get started monthly
              </Link>
            </div>

            {/* Annual */}
            <div className="bg-primary rounded-2xl p-8 flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Annual</p>
                <span className="bg-[#F97316] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Best value
                </span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">$249</span>
                <span className="text-white/60 text-base ml-1">/year</span>
              </div>
              <p className="text-sm text-white/60 mb-6">Save $99 compared to monthly</p>
              <ul className="space-y-3 mb-8 flex-1">
                {annualFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/85">
                    <span className="text-[#F97316] font-bold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center bg-white text-primary font-semibold py-3 px-6 rounded-lg hover:bg-white/90 transition-colors"
              >
                Get started annually
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-foreground/50 mt-6">
            🔒 Secure payment via Stripe · Cancel anytime · No hidden fees
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ── FINAL CTA BANNER ──────────────────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-snug">
            Your Child&apos;s Future Is Shaped By You.<br className="hidden sm:block" />
            Start Leading With Intention Today.
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join The Influence Lab and begin your journey to becoming The Ultimate Influencer™ in your child&apos;s life.
          </p>
          <Link
            href="/register"
            className="inline-block bg-accent text-white font-bold px-10 py-4 rounded-lg hover:bg-accent-hover transition-colors text-lg"
          >
            Create Your Free Account
          </Link>
          <p className="text-white/40 text-sm mt-4">No credit card required to get started.</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0f172a] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-5">
          {/* Brand */}
          <div className="text-center">
            <p className="text-white font-bold text-base">The Ultimate Influencer™</p>
            <p className="text-white/40 text-sm mt-1">The Premium Preventive Parenting Platform</p>
            <p className="text-white/40 text-sm">Parenting Today. Raising Tomorrow&apos;s Champions.</p>
          </div>

          {/* Contact */}
          <a
            href="mailto:hello@ultimateinfluencer.com"
            className="text-white/50 text-sm hover:text-white transition-colors"
          >
            hello@ultimateinfluencer.com
          </a>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="text-white/40 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="text-white/40 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" className="text-white/40 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-white/50">
            <Link href="/tracks" className="hover:text-white transition-colors">Modules</Link>
            <Link href="/subscribe" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </nav>

          {/* Copyright */}
          <p className="text-white/30 text-xs text-center">
            © 2026 The Ultimate Influencer™. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}
