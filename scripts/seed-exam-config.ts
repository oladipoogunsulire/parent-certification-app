import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // ── 1. Seed ExamConfiguration ──────────────────────────────────────────────
  const existing = await prisma.examConfiguration.findFirst()

  if (existing) {
    console.log("Exam configuration already exists — skipping")
  } else {
    await prisma.examConfiguration.create({
      data: {
        isEnabled: false,
        passingThreshold: 90,
        totalQuestions: 40,
        isTimed: true,
        timeLimitMinutes: 45,
        easyPercent: 40,
        mediumPercent: 40,
        hardPercent: 20,
        randomiseQuestions: true,
        randomiseOptions: true,
        certificateSignatory: "Dr. Tilis",
      },
    })
    console.log("Exam configuration seeded")
  }

  // ── 2. Migrate existing Question bank → ExamQuestion ──────────────────────
  const existingQuestions = await prisma.question.findMany({
    include: { options: true },
  })

  if (existingQuestions.length === 0) {
    console.log("No existing questions to migrate — skipping question migration")
    return
  }

  // Only migrate questions that haven't been migrated yet (avoid duplicates on re-run)
  const alreadyMigrated = await prisma.examQuestion.count()
  if (alreadyMigrated > 0) {
    console.log(
      `ExamQuestion bank already has ${alreadyMigrated} question(s) — skipping question migration`
    )
    return
  }

  let migratedCount = 0

  for (const q of existingQuestions) {
    await prisma.examQuestion.create({
      data: {
        questionText: q.questionText,
        difficulty: "MEDIUM",
        moduleTag: null,
        isActive: q.isActive,
        options: {
          create: q.options.map((opt, idx) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
            explanation: opt.explanationText ?? null,
            displayOrder: idx,
          })),
        },
      },
    })
    migratedCount++
  }

  console.log(`Migrated ${migratedCount} questions to ExamQuestion bank`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
