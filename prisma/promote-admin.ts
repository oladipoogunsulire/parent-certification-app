import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

const email = process.argv[2]

async function main() {
  if (!email) {
    console.error("Usage: pnpm promote:admin <email>")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  if (user.role === "ADMIN") {
    console.log(`${email} is already ADMIN — no change needed.`)
    return
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  })

  console.log(`✓ ${email} promoted to ADMIN`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
