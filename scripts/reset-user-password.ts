import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

async function main() {
  const email = getArg("--email")
  const password = getArg("--password")

  if (!email || !password) {
    console.error("Usage: pnpm reset:password --email <email> --password <newPassword>")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`Error: No user found with email "${email}"`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  })

  console.log(`Password updated successfully for ${email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
