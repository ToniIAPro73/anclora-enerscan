-- Premium data ingestion: imported CEE, reform budgets and field traceability.

CREATE TABLE "EnergyCertificate" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "attachmentId" TEXT,
  "sourceProgram" TEXT,
  "sourceFormat" TEXT NOT NULL,
  "extractionStatus" TEXT NOT NULL,
  "extractionConfidence" DOUBLE PRECISION,
  "issueDate" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "addressLine" TEXT,
  "cadastralReference" TEXT,
  "postalCode" TEXT,
  "municipality" TEXT,
  "province" TEXT,
  "useType" TEXT,
  "climateZone" TEXT,
  "yearBuilt" INTEGER,
  "usefulAreaM2" DOUBLE PRECISION,
  "builtAreaM2" DOUBLE PRECISION,
  "globalLetter" TEXT,
  "nonRenewableEPKwhM2Year" DOUBLE PRECISION,
  "emissionsKgCO2M2Year" DOUBLE PRECISION,
  "heatingDemandKwhM2Year" DOUBLE PRECISION,
  "coolingDemandKwhM2Year" DOUBLE PRECISION,
  "acsDemandKwhM2Year" DOUBLE PRECISION,
  "recommendationsJson" JSONB,
  "extractedFieldsJson" JSONB,
  "rawTextHash" TEXT,
  "rawXmlStored" BOOLEAN NOT NULL DEFAULT false,
  "reviewNotes" TEXT,
  CONSTRAINT "EnergyCertificate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RehabBudget" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "attachmentId" TEXT,
  "sourceFormat" TEXT NOT NULL,
  "extractionStatus" TEXT NOT NULL,
  "extractionConfidence" DOUBLE PRECISION,
  "providerName" TEXT,
  "budgetDate" TIMESTAMP(3),
  "totalAmount" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "vatIncluded" BOOLEAN,
  "detectedCategoriesJson" JSONB,
  "detectedMeasuresJson" JSONB,
  "lineItemsJson" JSONB,
  "estimatedCurrentLetter" TEXT,
  "estimatedPostBudgetLetter" TEXT,
  "targetLetter" TEXT,
  "targetReached" BOOLEAN,
  "impactConfidence" TEXT,
  "missingMeasuresJson" JSONB,
  "analysisSummary" TEXT,
  CONSTRAINT "RehabBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataFieldSource" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assessmentId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "confidence" DOUBLE PRECISION,
  "requiresReview" BOOLEAN NOT NULL DEFAULT false,
  "appliedToWizard" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "DataFieldSource_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EnergyCertificate"
  ADD CONSTRAINT "EnergyCertificate_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EnergyCertificate"
  ADD CONSTRAINT "EnergyCertificate_attachmentId_fkey"
  FOREIGN KEY ("attachmentId") REFERENCES "AssessmentAttachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RehabBudget"
  ADD CONSTRAINT "RehabBudget_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RehabBudget"
  ADD CONSTRAINT "RehabBudget_attachmentId_fkey"
  FOREIGN KEY ("attachmentId") REFERENCES "AssessmentAttachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataFieldSource"
  ADD CONSTRAINT "DataFieldSource_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
