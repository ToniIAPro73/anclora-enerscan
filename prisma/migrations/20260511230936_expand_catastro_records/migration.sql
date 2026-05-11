-- AlterTable
ALTER TABLE "CadastralRecord" ADD COLUMN     "internalBlock" TEXT,
ADD COLUMN     "internalDoor" TEXT,
ADD COLUMN     "internalFloor" TEXT,
ADD COLUMN     "internalStaircase" TEXT,
ADD COLUMN     "parcelReference" TEXT,
ADD COLUMN     "participationPct" DOUBLE PRECISION,
ADD COLUMN     "propertyUse" TEXT;
