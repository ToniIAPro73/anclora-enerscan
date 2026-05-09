/*
  Warnings:

  - Added the required column `updatedAt` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'REAL_ESTATE',
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "attributionMonths" INTEGER NOT NULL DEFAULT 12,
    "defaultCommissionRate" REAL,
    "notes" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assessmentId" TEXT,
    "providerId" TEXT,
    "partnerId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "requestedService" TEXT,
    "estimatedBudget" TEXT,
    "urgency" TEXT,
    "zone" TEXT,
    "source" TEXT,
    "attributionOwner" TEXT,
    "attributionExpiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "commissionStatus" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
    "expectedValueCents" INTEGER,
    "closedValueCents" INTEGER,
    "commissionCents" INTEGER,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "Lead_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("assessmentId", "createdAt", "id", "providerId", "status", "updatedAt")
SELECT "assessmentId", "createdAt", "id", "providerId", "status", CURRENT_TIMESTAMP FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "categories" TEXT NOT NULL,
    "zones" TEXT NOT NULL,
    "certifications" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL NOT NULL DEFAULT 4.5,
    "slaHours" INTEGER,
    "commissionType" TEXT,
    "commissionRate" REAL,
    "leadFeeCents" INTEGER,
    "monthlyFeeCents" INTEGER,
    "attributionMonths" INTEGER NOT NULL DEFAULT 12,
    "notes" TEXT,
    "source" TEXT,
    "partnerId" TEXT,
    CONSTRAINT "Provider_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Provider" ("categories", "id", "name", "rating", "verified", "zones", "updatedAt")
SELECT "categories", "id", "name", "rating", "verified", "zones", CURRENT_TIMESTAMP FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
