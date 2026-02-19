-- AlterTable
ALTER TABLE "house_viewing_interests"
ADD COLUMN "outcomeStatus" TEXT NOT NULL DEFAULT 'abandoned',
ADD COLUMN "purchaseAmount" DOUBLE PRECISION,
ADD COLUMN "purchaseMarkedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "land_viewing_interests"
ADD COLUMN "outcomeStatus" TEXT NOT NULL DEFAULT 'abandoned',
ADD COLUMN "purchaseAmount" DOUBLE PRECISION,
ADD COLUMN "purchaseMarkedAt" TIMESTAMP(3);
