import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AppHeader from "@/app/components/AppHeader"

export default async function TracksPage() {
  const tracks = await prisma.track.findMany({
    where: { isActive: true },
    include: {
      belts: {
        orderBy: { orderIndex: "asc" },
      },
      modules: {
        where: { isActive: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">Influence Modules</h2>
          <p className="text-foreground/60 mt-1">
            Choose a module to begin your parenting journey.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-foreground/50">No modules available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <Link
                key={track.id}
                href={`/tracks/${track.id}`}
                className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-accent transition-all block"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {track.ageBand ?? "All ages"}
                  </span>
                  <span className="text-xs text-foreground/40">{track.belts.length} belts</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {track.trackName}
                </h3>
                {track.description && (
                  <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                    {track.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-foreground/40">{track.modules.length} modules</span>
                  <div className="flex gap-1">
                    {track.belts.map((belt) => (
                      <span
                        key={belt.id}
                        title={belt.beltLevel}
                        className={`w-4 h-4 rounded-full ${beltDot(belt.beltLevel)}`}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function beltDot(level: string): string {
  const map: Record<string, string> = {
    WHITE: "bg-gray-200",
    YELLOW: "bg-yellow-400",
    ORANGE: "bg-orange-400",
    GREEN: "bg-green-500",
    BLUE: "bg-blue-500",
    BROWN: "bg-amber-600",
    BLACK: "bg-gray-900",
  }
  return map[level.toUpperCase()] ?? "bg-gray-300"
}
