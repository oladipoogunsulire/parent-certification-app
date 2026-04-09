-- CreateTable
CREATE TABLE "user_security_questions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question1" TEXT NOT NULL,
    "answer1Hash" TEXT NOT NULL,
    "question2" TEXT NOT NULL,
    "answer2Hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_security_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_security_questions_userId_key" ON "user_security_questions"("userId");

-- AddForeignKey
ALTER TABLE "user_security_questions" ADD CONSTRAINT "user_security_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
