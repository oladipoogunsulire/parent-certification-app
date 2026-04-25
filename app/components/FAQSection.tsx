"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "Is this backed by research?",
    a: "Yes. The Ultimate Influencer™ curriculum is developed by Dr. Tilis, a child development expert with decades of experience. Every module is grounded in developmental psychology and real parenting research.",
  },
  {
    q: "How long does it take to complete?",
    a: "Most parents complete one module per week, making the full curriculum a 10-week journey. You can go faster or slower — there are no deadlines and you keep access as long as your subscription is active.",
  },
  {
    q: "What age of children is this designed for?",
    a: "The curriculum covers child development from birth through young adulthood. Whether your children are toddlers or teenagers, you will find modules directly relevant to your stage of parenting.",
  },
  {
    q: "What if I cancel my subscription?",
    a: "You can cancel anytime from your account settings. You will keep full access until the end of your current billing period. There are no cancellation fees.",
  },
  {
    q: "What is the Influence Score™?",
    a: "The Influence Score™ measures the quality of your parenting decisions through scenario-based responses. It gives you a real-time picture of your influence effectiveness — not just whether you completed content, but how well you are applying it.",
  },
  {
    q: "What is the Black Belt exam?",
    a: "The Black Belt certification exam is the final step in your journey. After completing all 10 modules you become eligible to take a comprehensive exam. Passing with 90% or above earns you the Certified Ultimate Influencer™ designation and a printable certificate.",
  },
  {
    q: "Is this suitable for single parents?",
    a: "Absolutely. The curriculum is designed for any parent regardless of family structure. The principles of intentional parenting apply equally whether you are parenting solo or with a partner.",
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="bg-background py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-foreground text-base">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-foreground/40 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-foreground/70 leading-relaxed border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
