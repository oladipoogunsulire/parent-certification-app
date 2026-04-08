-- AlterTable: add optional video URL fields to lessons
ALTER TABLE "lessons" ADD COLUMN "introVideoUrl" TEXT;
ALTER TABLE "lessons" ADD COLUMN "mainVideoUrl" TEXT;

-- AlterTable: add optional video URL field to scenarios
ALTER TABLE "scenarios" ADD COLUMN "videoUrl" TEXT;
