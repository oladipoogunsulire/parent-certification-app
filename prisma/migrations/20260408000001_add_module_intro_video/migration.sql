-- AlterTable: add optional intro video URL to modules
ALTER TABLE "modules" ADD COLUMN IF NOT EXISTS "introVideoUrl" TEXT;
