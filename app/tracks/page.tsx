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
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Certification Tracks</h2>
          <p className="text-gray-600 mt-1">
            Choose a track to begin your structured parenting certification journey.
          </p>
        </div>

        {tracks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No tracks available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <Link
                key={track.id}
                href={`/tracks/${track.id}`}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all block"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {track.ageBand ?? "All ages"}
                  </span>
                  <span className="text-xs text-gray-400">{track.belts.length} belts</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {track.trackName}
                </h3>
                {track.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {track.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{track.modules.length} modules</span>
                  <div className="flex gap-1">
                    {track.belts.map((belt) => (
                      <span
                        key={belt.id}
                        title={belt.beltLevel}
                        className={`w-4 h-4 rounded-full ${beltColor(belt.beltLevel)}`}
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

function beltColor(level: string): string {
  const map: Record<string, string> = {
    WHITE: "bg-gray-200",
    YELLOW: "bg-yellow-400",
    GREEN: "bg-green-500",
    BLUE: "bg-blue-500",
    BLACK: "bg-gray-900",
  }
  return map[level.toUpperCase()] ?? "bg-gray-300"
}
