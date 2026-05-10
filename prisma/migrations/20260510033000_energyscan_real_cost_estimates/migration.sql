-- CreateTable
CREATE TABLE "PriceSource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "versionLabel" TEXT,
    "region" TEXT,
    "url" TEXT,
    "licenseNote" TEXT,
    "reliability" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PriceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guid" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "externalCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "minUnitPrice" DOUBLE PRECISION NOT NULL,
    "midUnitPrice" DOUBLE PRECISION,
    "maxUnitPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "region" TEXT,
    "category" TEXT NOT NULL,
    "applicableTo" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyMeasure" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "impactArea" TEXT NOT NULL,
    "defaultPriority" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "typicalLetterGainMin" INTEGER,
    "typicalLetterGainMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EnergyMeasure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurePriceMap" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "measureId" TEXT NOT NULL,
    "priceItemId" TEXT NOT NULL,
    "quantityFormula" TEXT NOT NULL,
    "defaultFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minFactor" DOUBLE PRECISION,
    "maxFactor" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "MeasurePriceMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentId" TEXT,
    "scenarioId" TEXT,
    "scenarioTitle" TEXT,
    "propertyType" TEXT,
    "profile" TEXT,
    "letterGainTarget" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "minTotal" DOUBLE PRECISION NOT NULL,
    "midTotal" DOUBLE PRECISION,
    "maxTotal" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL,
    "sourceSummary" TEXT,
    "assumptions" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,

    CONSTRAINT "EstimateRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateLine" (
    "id" TEXT NOT NULL,
    "estimateRunId" TEXT NOT NULL,
    "measureCode" TEXT NOT NULL,
    "priceItemCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "minUnitPrice" DOUBLE PRECISION NOT NULL,
    "midUnitPrice" DOUBLE PRECISION,
    "maxUnitPrice" DOUBLE PRECISION NOT NULL,
    "minSubtotal" DOUBLE PRECISION NOT NULL,
    "midSubtotal" DOUBLE PRECISION,
    "maxSubtotal" DOUBLE PRECISION NOT NULL,
    "sourceLabel" TEXT,
    "confidence" TEXT NOT NULL,
    "assumptions" TEXT,

    CONSTRAINT "EstimateLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceItem_guid_key" ON "PriceItem"("guid");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyMeasure_guid_key" ON "EnergyMeasure"("guid");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyMeasure_code_key" ON "EnergyMeasure"("code");

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PriceSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurePriceMap" ADD CONSTRAINT "MeasurePriceMap_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "EnergyMeasure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurePriceMap" ADD CONSTRAINT "MeasurePriceMap_priceItemId_fkey" FOREIGN KEY ("priceItemId") REFERENCES "PriceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRun" ADD CONSTRAINT "EstimateRun_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateLine" ADD CONSTRAINT "EstimateLine_estimateRunId_fkey" FOREIGN KEY ("estimateRunId") REFERENCES "EstimateRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

