import { prisma } from "@/lib/prisma"
import ExamSettingsForm, { type ExamConfigData } from "./ExamSettingsForm"
import ExamQuestionBank, { type QuestionItem } from "./ExamQuestionBank"

export default async function AdminExamPage() {
  // Fetch or auto-create exam configuration
  let config = await prisma.examConfiguration.findFirst()
  if (!config) {
    config = await prisma.examConfiguration.create({
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
  }

  // Fetch all exam questions with their options
  const questions = await prisma.examQuestion.findMany({
    include: {
      options: { orderBy: { displayOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch active modules for the moduleTag select
  const modules = await prisma.module.findMany({
    where: { isActive: true },
    select: { id: true, moduleTitle: true },
    orderBy: { createdAt: "asc" },
  })

  // Active question counts per difficulty
  const activeQuestions = questions.filter((q) => q.isActive)
  const questionCounts = {
    easy: activeQuestions.filter((q) => q.difficulty === "EASY").length,
    medium: activeQuestions.filter((q) => q.difficulty === "MEDIUM").length,
    hard: activeQuestions.filter((q) => q.difficulty === "HARD").length,
  }

  // Serialise for client components
  const configData: ExamConfigData = {
    id: config.id,
    isEnabled: config.isEnabled,
    passingThreshold: config.passingThreshold,
    totalQuestions: config.totalQuestions,
    isTimed: config.isTimed,
    timeLimitMinutes: config.timeLimitMinutes,
    easyPercent: config.easyPercent,
    mediumPercent: config.mediumPercent,
    hardPercent: config.hardPercent,
    randomiseQuestions: config.randomiseQuestions,
    randomiseOptions: config.randomiseOptions,
    certificateSignatory: config.certificateSignatory,
  }

  const questionsData: QuestionItem[] = questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
    moduleTag: q.moduleTag,
    isActive: q.isActive,
    createdAt: q.createdAt.toISOString(),
    options: q.options.map((o) => ({
      id: o.id,
      optionText: o.optionText,
      isCorrect: o.isCorrect,
      explanation: o.explanation,
      displayOrder: o.displayOrder,
    })),
  }))

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1E3A5F]">Black Belt Exam</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure exam settings and manage the question bank.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left column — settings */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4">Exam configuration</h3>
          <ExamSettingsForm initial={configData} questionCounts={questionCounts} />
        </div>

        {/* Right column — question bank */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4">Question bank</h3>
          <ExamQuestionBank
            initialQuestions={questionsData}
            modules={modules}
          />
        </div>
      </div>
    </div>
  )
}
