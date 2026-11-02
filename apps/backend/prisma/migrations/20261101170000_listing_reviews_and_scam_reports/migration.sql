-- Listing reviews and private scam reports. New tables only.

CREATE TYPE "ListingKind" AS ENUM ('professional', 'vendor', 'artisan');
CREATE TYPE "ListingReviewStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "ScamReportStatus" AS ENUM ('new', 'investigating', 'upheld', 'dismissed');

CREATE TABLE "listing_reviews" (
  "id" TEXT NOT NULL,
  "listingKind" "ListingKind" NOT NULL,
  "listingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" VARCHAR(80),
  "comment" TEXT NOT NULL,
  "verifiedBmhJob" BOOLEAN NOT NULL DEFAULT false,
  "projectId" TEXT,
  "status" "ListingReviewStatus" NOT NULL DEFAULT 'pending',
  "moderatedById" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "listing_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_reviews_listingKind_listingId_userId_key" ON "listing_reviews"("listingKind", "listingId", "userId");
CREATE INDEX "listing_reviews_listingKind_listingId_status_idx" ON "listing_reviews"("listingKind", "listingId", "status");

ALTER TABLE "listing_reviews" ADD CONSTRAINT "listing_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_reviews" ADD CONSTRAINT "listing_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "scam_reports" (
  "id" TEXT NOT NULL,
  "listingKind" "ListingKind" NOT NULL,
  "listingId" TEXT NOT NULL,
  "reporterUserId" TEXT NOT NULL,
  "whatHappened" TEXT NOT NULL,
  "amountNaira" INTEGER,
  "incidentDate" TIMESTAMP(3),
  "evidenceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "contactConsent" BOOLEAN NOT NULL,
  "contactPhone" TEXT,
  "status" "ScamReportStatus" NOT NULL DEFAULT 'new',
  "assignedAdminId" TEXT,
  "adminNotes" TEXT,
  "publicNotice" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scam_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scam_reports_status_createdAt_idx" ON "scam_reports"("status", "createdAt");
CREATE INDEX "scam_reports_listingKind_listingId_idx" ON "scam_reports"("listingKind", "listingId");

ALTER TABLE "scam_reports" ADD CONSTRAINT "scam_reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
