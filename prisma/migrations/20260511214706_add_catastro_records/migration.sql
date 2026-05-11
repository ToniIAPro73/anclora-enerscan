-- CreateTable
CREATE TABLE "CadastralRecord" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "cadastralReference" TEXT,
    "province" TEXT,
    "municipality" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "surfaceBuiltM2" DOUBLE PRECISION,
    "surfacePlotM2" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "sourceSystem" TEXT NOT NULL DEFAULT 'catastro',
    "sourceMode" TEXT,
    "confidence" DOUBLE PRECISION DEFAULT 1,
    "retrievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CadastralRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CadastralRecord_assessmentId_key" ON "CadastralRecord"("assessmentId");

-- AddForeignKey
ALTER TABLE "CadastralRecord" ADD CONSTRAINT "CadastralRecord_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
