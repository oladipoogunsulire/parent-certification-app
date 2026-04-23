import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import UsersClient, { type UserListItem } from "./UsersClient"

export default async function ManageUsersPage() {
  const session = await auth()

  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id:          true,
        email:       true,
        name:        true,
        firstName:   true,
        lastName:    true,
        displayName: true,
        image:       true,
        role:        true,
        isActive:    true,
        currentBelt: true,
        beltEarnedAt: true,
        createdAt:   true,
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          select: { id: true },
        },
        ceRecords: {
          select: { id: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { email: session!.user!.email! },
      select: { id: true },
    }),
  ])

  const serialized: UserListItem[] = users.map((u) => ({
    id:           u.id,
    email:        u.email,
    name:         u.name,
    firstName:    u.firstName,
    lastName:     u.lastName,
    displayName:  u.displayName,
    image:        u.image,
    role:         u.role,
    isActive:     u.isActive,
    currentBelt:  u.currentBelt,
    beltEarnedAt: u.beltEarnedAt?.toISOString() ?? null,
    createdAt:    u.createdAt.toISOString(),
    hasActiveSub: u.subscriptions.length > 0,
    moduleCount:  u.ceRecords.length,
    isSelf:       u.id === currentUser?.id,
  }))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E3A5F]">Users</h2>
        <p className="text-sm text-gray-500 mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""} registered
        </p>
      </div>
      <UsersClient users={serialized} />
    </div>
  )
}
