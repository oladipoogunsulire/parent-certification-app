import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

const ADMIN_EMAIL = "admin@pcwa.dev"
const ADMIN_PASSWORD = "Admin@1234!"

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      firstName: "Admin",
      displayName: "Admin",
    },
  })

  console.log(`Admin user ready: ${user.email} (id: ${user.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
