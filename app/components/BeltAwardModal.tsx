"use client"

// ---------------------------------------------------------------------------
// BeltAwardModal
//
// Full-screen celebratory overlay shown when a user earns a new belt.
// Confetti is pure CSS — no external libraries.
// ---------------------------------------------------------------------------

interface Props {
  beltName: string
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
    case "Brown Belt":  return "text-amber-600"
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
    case "Brown Belt":  return "You're mastering the art of influence"
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

// 36 pieces — varied positions, delays, durations, sizes, shapes
const CONFETTI_PIECES = Array.from({ length: 36 }, (_, i) => ({
  left:     `${((i * 2.78) % 100).toFixed(1)}%`,
  delay:    `${((i * 0.09) % 1.6).toFixed(2)}s`,
  duration: `${(1.6 + ((i * 0.08) % 0.9)).toFixed(2)}s`,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size:     `${6 + (i % 5) * 2}px`,
  // Alternate between circle and rectangle for variety
  radius:   i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%",
  rotation: `${(i * 53) % 360}deg`,
}))

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BeltAwardModal({ beltName, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="belt-award-heading"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Confetti layer — sits between backdrop and card */}
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

      {/* Modal card */}
      <div className="relative z-10 bg-[#1E3A5F] rounded-2xl shadow-2xl mx-4 w-full max-w-sm text-center px-8 py-10 flex flex-col items-center gap-4">
        {/* Belt emoji */}
        <div className="text-6xl select-none" role="img" aria-label="Belt award">
          🥋
        </div>

        {/* Heading */}
        <h2
          id="belt-award-heading"
          className="text-2xl font-extrabold text-white tracking-tight"
        >
          Belt Earned!
        </h2>

        {/* Belt name — large, colour-coded */}
        <p className={`text-3xl font-black ${beltTextClass(beltName)}`}>
          {beltName}
        </p>

        {/* Motivational message */}
        <p className="text-white/70 text-sm leading-relaxed px-2">
          {beltMessage(beltName)}
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          className="mt-2 w-full min-h-[48px] bg-[#F97316] hover:bg-[#e06810] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Continue learning
        </button>
      </div>

      {/* Confetti keyframes */}
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
