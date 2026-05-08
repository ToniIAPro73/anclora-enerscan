ALTER TABLE "Assessment" ADD COLUMN "orientation" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "roofType" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "ventilation" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "timelineHorizon" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "AssessmentAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentAttachment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
