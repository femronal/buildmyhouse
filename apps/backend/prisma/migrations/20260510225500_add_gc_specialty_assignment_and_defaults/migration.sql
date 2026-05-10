-- Add structured specialty fields for admin-assigned GC specialization.
ALTER TABLE "contractors"
ADD COLUMN "specialtyCategory" TEXT,
ADD COLUMN "specialtyTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- New GC defaults: start from 5.0 rating and at least 10 projects.
ALTER TABLE "contractors"
ALTER COLUMN "rating" SET DEFAULT 5.0,
ALTER COLUMN "projects" SET DEFAULT 10;

-- Backfill existing records safely.
UPDATE "contractors"
SET "rating" = 5.0
WHERE "rating" IS NULL OR ("rating" <= 0 AND "reviews" = 0);

UPDATE "contractors"
SET "projects" = 10
WHERE "projects" IS NULL OR "projects" < 10;

UPDATE "contractors"
SET "specialtyCategory" = 'general_contractor'
WHERE "specialtyCategory" IS NULL AND "type" = 'general_contractor';

UPDATE "contractors"
SET "specialtyTags" = ARRAY["specialty"]
WHERE ("specialtyTags" IS NULL OR array_length("specialtyTags", 1) IS NULL)
  AND COALESCE(NULLIF(TRIM("specialty"), ''), '') <> '';
