import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log("Resetting Influence Score™ data…")

  const deletedAttempts = await prisma.userScenarioAttempt.deleteMany({})
  console.log(`Deleted ${deletedAttempts.count} scenario attempt(s)`)

  const deletedProfiles = await prisma.userInfluenceProfile.deleteMany({})
  console.log(`Deleted ${deletedProfiles.count} influence profile(s)`)

  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
