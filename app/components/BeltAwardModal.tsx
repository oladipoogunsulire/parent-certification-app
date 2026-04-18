"use client"

// ---------------------------------------------------------------------------
// BeltAwardModal
//
// Three modes:
//   "belt-earned"     — Belt milestone during module progression (with confetti)
//   "module-complete" — All 10 modules done; exam unlocked (no confetti)
//   "exam-passed"     — Black Belt exam passed (with confetti + two CTA buttons)
// ---------------------------------------------------------------------------

interface Props {
  mode?: "belt-earned" | "module-complete" | "exam-passed"
  /** Required when mode="belt-earned" */
  beltName?: string
  /** Used in mode="exam-passed" to construct certificate link */
  userId?: string
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Belt colour / message maps
// ---------------------------------------------------------------------------

function beltTextClass(belt: string): string {
  switch (belt) {
    case "White Belt":  return "text-gray-200 drop-shadow"
    case "Yellow Belt": return "text-yellow-400"
    case "Green Belt":  return "text-green-400"
    case "Blue Belt":   return "text-blue-400"
    case "Black Belt":  return "text-yellow-400"
    default:            return "text-white"
  }
}

function beltMessage(belt: string): string {
  switch (belt) {
    case "White Belt":  return "Your influence journey has begun"
    case "Yellow Belt": return "Your parenting awareness is growing"
    case "Green Belt":  return "You're developing real influence skills"
    case "Blue Belt":   return "You're becoming a highly intentional parent"
    case "Black Belt":  return "You are The Ultimate Influencer™"
    default:            return "Keep going — you're making a difference"
  }
}

// ---------------------------------------------------------------------------
// Confetti data — deterministic, safe for SSR (no Math.random at render)
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = [
  "#F97316", "#1E3A5F", "#FCD34D", "#22C55E",
  "#3B82F6", "#EF4444", "#A855F7", "#EC4899",
]

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, i) => ({
  left:     `${((i * 2.78) % 100).toFixed(1)}%`,
  delay:    `${((i * 0.09) % 1.6).toFixed(2)}s`,
  duration: `${(1.6 + ((i * 0.08) % 0.9)).toFixed(2)}s`,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size:     `${6 + (i % 5) * 2}px`,
  radius:   i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%",
  rotation: `${(i * 53) % 360}deg`,
}))

function ConfettiLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {CONFETTI_PIECES.map((piece, i) => (
        <div
          key={i}
          style={{
            position:         "absolute",
            top:              "-12px",
            left:             piece.left,
            width:            piece.size,
            height:           piece.size,
            backgroundColor:  piece.color,
            borderRadius:     piece.radius,
            transform:        `rotate(${piece.rotation})`,
            animation:        `confettiFall ${piece.duration} ${piece.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BeltAwardModal({ mode = "belt-earned", beltName, userId, onClose }: Props) {
  const showConfetti = mode === "belt-earned" || mode === "exam-passed"

  // ── Module-complete mode ──────────────────────────────────────────────────
  if (mode === "module-complete") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-complete-heading"
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl mx-4 w-full max-w-sm text-center px-8 py-10 flex flex-col items-center gap-4">
          <div className="text-6xl select-none" role="img" aria-label="Graduation cap">
            🎓
          </div>
          <h2 id="module-complete-heading" className="text-2xl font-extrabold text-[#1E3A5F] tracking-tight">
            All Modules Complete!
          </h2>
          <p className="text-foreground/60 text-sm leading-relaxed">
            You've completed the entire Ultimate Influencer™ curriculum
          </p>
          <p className="text-foreground/80 text-sm leading-relaxed px-2 font-medium">
            Now prove your mastery — take the Black Belt exam to earn your certification
          </p>
          <a
            href="/exam"
            onClick={onClose}
            className="mt-2 w-full min-h-[48px] flex items-center justify-center bg-[#1E3A5F] hover:bg-[#162d4a] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Take the exam →
          </a>
          <button
            onClick={onClose}
            className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            Continue learning
          </button>
        </div>
      </div>
    )
  }

  // ── Exam-passed mode ─────────────────────────────────────────────────────
  if (mode === "exam-passed") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-passed-heading"
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <ConfettiLayer />
        <div className="relative z-10 bg-[#1E3A5F] rounded-2xl shadow-2xl mx-4 w-full max-w-sm text-center px-8 py-10 flex flex-col items-center gap-4">
          <div className="text-6xl select-none" role="img" aria-label="Martial arts belt">
            🥋
          </div>
          <h2 id="exam-passed-heading" className="text-2xl font-extrabold text-white tracking-tight">
            Black Belt Earned!
          </h2>
          <p className="text-3xl font-black text-yellow-400">
            The Ultimate Influencer™
          </p>
          <p className="text-white/70 text-sm leading-relaxed px-2">
            You Are Your Child's Most Powerful Influence
          </p>
          <div className="mt-2 w-full flex flex-col gap-3">
            {userId && (
              <a
                href={`/certificate/${userId}`}
                className="w-full min-h-[48px] flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-[#1E3A5F] font-bold text-sm rounded-xl transition-colors"
              >
                View Certificate
              </a>
            )}
            <a
              href="/dashboard"
              onClick={onClose}
              className="w-full min-h-[48px] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
        <style>{`
          @keyframes confettiFall {
            0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
            80%  { opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  // ── Belt-earned mode (default) ────────────────────────────────────────────
  const name = beltName ?? ""
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="belt-award-heading"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <ConfettiLayer />
      <div className="relative z-10 bg-[#1E3A5F] rounded-2xl shadow-2xl mx-4 w-full max-w-sm text-center px-8 py-10 flex flex-col items-center gap-4">
        <div className="text-6xl select-none" role="img" aria-label="Belt award">
          🥋
        </div>
        <h2 id="belt-award-heading" className="text-2xl font-extrabold text-white tracking-tight">
          Belt Earned!
        </h2>
        <p className={`text-3xl font-black ${beltTextClass(name)}`}>
          {name}
        </p>
        <p className="text-white/70 text-sm leading-relaxed px-2">
          {beltMessage(name)}
        </p>
        <button
          onClick={onClose}
          className="mt-2 w-full min-h-[48px] bg-[#F97316] hover:bg-[#e06810] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Continue learning
        </button>
      </div>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
