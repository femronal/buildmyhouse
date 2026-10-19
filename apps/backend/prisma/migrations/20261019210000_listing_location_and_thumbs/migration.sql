ALTER TABLE "house_for_sale" ADD COLUMN "stateSlug" TEXT;
ALTER TABLE "house_for_sale" ADD COLUMN "lgaSlug" TEXT;
ALTER TABLE "house_for_sale" ADD COLUMN "areaSlug" TEXT;
CREATE INDEX "house_for_sale_stateSlug_idx" ON "house_for_sale"("stateSlug");
ALTER TABLE "house_for_sale_images" ADD COLUMN "thumbnailUrl" TEXT;

ALTER TABLE "land_for_sale" ADD COLUMN "stateSlug" TEXT;
ALTER TABLE "land_for_sale" ADD COLUMN "lgaSlug" TEXT;
ALTER TABLE "land_for_sale" ADD COLUMN "areaSlug" TEXT;
CREATE INDEX "land_for_sale_stateSlug_idx" ON "land_for_sale"("stateSlug");
ALTER TABLE "land_for_sale_images" ADD COLUMN "thumbnailUrl" TEXT;

ALTER TABLE "rental_listings" ADD COLUMN "stateSlug" TEXT;
ALTER TABLE "rental_listings" ADD COLUMN "lgaSlug" TEXT;
ALTER TABLE "rental_listings" ADD COLUMN "areaSlug" TEXT;
CREATE INDEX "rental_listings_stateSlug_idx" ON "rental_listings"("stateSlug");
ALTER TABLE "rental_listing_images" ADD COLUMN "thumbnailUrl" TEXT;
