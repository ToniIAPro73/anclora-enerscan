-- AlterTable
ALTER TABLE "AssessmentAttachment" ADD COLUMN "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "ocrData" JSONB,
ADD COLUMN "ocrProcessedAt" TIMESTAMP(3),
ADD COLUMN "ocrError" TEXT;
