-- DropForeignKey
ALTER TABLE "house_viewing_interests" DROP CONSTRAINT "house_viewing_interests_houseForSaleId_fkey";

-- DropForeignKey
ALTER TABLE "land_viewing_interests" DROP CONSTRAINT "land_viewing_interests_landForSaleId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_projectId_fkey";

-- DropForeignKey
ALTER TABLE "rental_viewing_interests" DROP CONSTRAINT "rental_viewing_interests_rentalListingId_fkey";

-- AlterTable
ALTER TABLE "house_viewing_interests" ADD COLUMN     "snapshotImageUrl" TEXT,
ADD COLUMN     "snapshotLocation" TEXT,
ADD COLUMN     "snapshotName" TEXT,
ADD COLUMN     "snapshotPrice" DOUBLE PRECISION,
ALTER COLUMN "houseForSaleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "land_viewing_interests" ADD COLUMN     "snapshotImageUrl" TEXT,
ADD COLUMN     "snapshotLocation" TEXT,
ADD COLUMN     "snapshotName" TEXT,
ADD COLUMN     "snapshotPrice" DOUBLE PRECISION,
ADD COLUMN     "snapshotSizeSqm" DOUBLE PRECISION,
ALTER COLUMN "landForSaleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "snapshotProjectName" TEXT,
ADD COLUMN     "snapshotStageName" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "rental_viewing_interests" ADD COLUMN     "snapshotAgencyFeePercent" DOUBLE PRECISION,
ADD COLUMN     "snapshotAnnualRent" DOUBLE PRECISION,
ADD COLUMN     "snapshotCautionDeposit" DOUBLE PRECISION,
ADD COLUMN     "snapshotImageUrl" TEXT,
ADD COLUMN     "snapshotLegalFeePercent" DOUBLE PRECISION,
ADD COLUMN     "snapshotLocation" TEXT,
ADD COLUMN     "snapshotServiceCharge" DOUBLE PRECISION,
ADD COLUMN     "snapshotTitle" TEXT,
ALTER COLUMN "rentalListingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_viewing_interests" ADD CONSTRAINT "house_viewing_interests_houseForSaleId_fkey" FOREIGN KEY ("houseForSaleId") REFERENCES "house_for_sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_viewing_interests" ADD CONSTRAINT "land_viewing_interests_landForSaleId_fkey" FOREIGN KEY ("landForSaleId") REFERENCES "land_for_sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_viewing_interests" ADD CONSTRAINT "rental_viewing_interests_rentalListingId_fkey" FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
