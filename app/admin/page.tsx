import { prisma } from "@/lib/prisma"

export default async function AdminPage() {
  const [userCount, trackCount, certCount] = await Promise.all([
    prisma.user.count(),
    prisma.track.count(),
    prisma.certification.count(),
  ])

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
          <p className="text-sm text-foreground/60">Total users</p>
          <p className="text-3xl font-bold text-primary mt-1">{userCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
          <p className="text-sm text-foreground/60">Active Modules</p>
          <p className="text-3xl font-bold text-primary mt-1">{trackCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 border-l-4 border-l-accent shadow-sm p-6">
          <p className="text-sm text-foreground/60">Certifications issued</p>
          <p className="text-3xl font-bold text-primary mt-1">{certCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/tracks" className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 hover:border-accent transition-colors">
          <h3 className="font-semibold text-primary">Manage Modules</h3>
          <p className="text-sm text-foreground/60 mt-1">Create and edit certification modules, belts, lessons and scenarios</p>
        </a>
        <a href="/admin/users" className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 hover:border-accent transition-colors">
          <h3 className="font-semibold text-primary">Manage Users</h3>
          <p className="text-sm text-foreground/60 mt-1">View users, manage roles and certification states</p>
        </a>
      </div>
    </div>
  )
}
