-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "objective" TEXT,
    "propertyType" TEXT,
    "year" INTEGER NOT NULL,
    "area" REAL NOT NULL,
    "zipcode" TEXT NOT NULL,
    "heating" TEXT,
    "cooling" TEXT,
    "waterHeating" TEXT,
    "windows" TEXT,
    "renewables" TEXT,
    "facadeInsulation" TEXT,
    "roofInsulation" TEXT,
    "budgetRange" TEXT,
    "targetLetter" TEXT,
    "score" REAL,
    "estimatedLetter" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "climateZone" TEXT,
    "penalties" TEXT,
    "strengths" TEXT,
    "missingData" TEXT,
    "explanation" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categories" TEXT NOT NULL,
    "zones" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "rating" REAL NOT NULL DEFAULT 4.5
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
