-- Photo checks for new stage photos. Existing rows stay unknown with the new fields empty.

CREATE TYPE "StageMediaSource" AS ENUM ('camera', 'gallery', 'admin_upload', 'whatsapp', 'unknown');

ALTER TABLE "stage_media" ADD COLUMN "uploadedByUserId" TEXT;
ALTER TABLE "stage_media" ADD COLUMN "capturedAt" TIMESTAMP(3);
ALTER TABLE "stage_media" ADD COLUMN "captureLat" DOUBLE PRECISION;
ALTER TABLE "stage_media" ADD COLUMN "captureLng" DOUBLE PRECISION;
ALTER TABLE "stage_media" ADD COLUMN "accuracyMeters" DOUBLE PRECISION;
ALTER TABLE "stage_media" ADD COLUMN "distanceFromSiteMeters" DOUBLE PRECISION;
ALTER TABLE "stage_media" ADD COLUMN "source" "StageMediaSource" NOT NULL DEFAULT 'unknown';
ALTER TABLE "stage_media" ADD COLUMN "sha256" TEXT;
ALTER TABLE "stage_media" ADD COLUMN "originalSha256" TEXT;
ALTER TABLE "stage_media" ADD COLUMN "duplicateOfMediaId" TEXT;

CREATE INDEX "stage_media_sha256_idx" ON "stage_media"("sha256");
CREATE INDEX "stage_media_originalSha256_idx" ON "stage_media"("originalSha256");

ALTER TABLE "stage_media" ADD CONSTRAINT "stage_media_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stage_media" ADD CONSTRAINT "stage_media_duplicateOfMediaId_fkey" FOREIGN KEY ("duplicateOfMediaId") REFERENCES "stage_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
