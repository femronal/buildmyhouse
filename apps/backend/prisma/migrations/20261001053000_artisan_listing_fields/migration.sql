ALTER TABLE "artisan_listings" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "artisan_listings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "artisan_listings" ADD COLUMN IF NOT EXISTS "researchConfidence" TEXT;
ALTER TABLE "artisan_listings" ADD COLUMN IF NOT EXISTS "suppressedFromRelist" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "artisan_listings" ADD COLUMN IF NOT EXISTS "suppressionReason" TEXT;
