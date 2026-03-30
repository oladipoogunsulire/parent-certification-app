import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminTracksPage() {
  const tracks = await prisma.track.findMany({
    include: {
      belts: true,
      modules: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tracks</h2>
        <Link
          href="/admin/tracks/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Create track
        </Link>
      </div>

      {tracks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No tracks yet.</p>
          <Link
            href="/admin/tracks/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create your first track
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Track</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Age Band</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Belts</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Modules</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tracks.map((track) => (
                <tr key={track.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{track.trackName}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{track.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{track.ageBand ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{track.belts.length}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{track.modules.length}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      track.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {track.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/tracks/${track.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}