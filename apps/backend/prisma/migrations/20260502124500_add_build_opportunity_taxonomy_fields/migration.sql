ALTER TABLE "house_for_sale"
ADD COLUMN "opportunityCategory" TEXT,
ADD COLUMN "opportunityType" TEXT;

ALTER TABLE "land_for_sale"
ADD COLUMN "opportunityCategory" TEXT,
ADD COLUMN "opportunityType" TEXT;

ALTER TABLE "rental_listings"
ADD COLUMN "opportunityCategory" TEXT,
ADD COLUMN "opportunityType" TEXT;
