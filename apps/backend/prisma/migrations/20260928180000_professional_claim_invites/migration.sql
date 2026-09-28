-- Professional claim invites, owner-claim fields, and private owner documents.
-- Sibling of vendor_claim_invites. Does not alter ownershipStatus.
--
-- Down (run manually; do not apply while rows still use needs_recheck):
-- ALTER TABLE "professional_listings" DROP CONSTRAINT IF EXISTS "professional_listings_claimedByUserId_fkey";
-- DROP INDEX IF EXISTS "professional_listings_claimedByUserId_key";
-- ALTER TABLE "professional_listings" DROP COLUMN IF EXISTS "claimedAt", DROP COLUMN IF EXISTS "claimEmail", DROP COLUMN IF EXISTS "claimedByUserId";
-- DROP TABLE IF EXISTS "professional_documents";
-- DROP TABLE IF EXISTS "professional_claim_invites";
-- Reversing needs_recheck requires rebuilding the enum after no row uses that value.

ALTER TYPE "ProfessionalCredentialVerification" ADD VALUE IF NOT EXISTS 'needs_recheck';

ALTER TABLE "professional_listings"
  ADD COLUMN "claimedAt" TIMESTAMP(3),
  ADD COLUMN "claimEmail" TEXT,
  ADD COLUMN "claimedByUserId" TEXT;

CREATE UNIQUE INDEX "professional_listings_claimedByUserId_key" ON "professional_listings"("claimedByUserId");

ALTER TABLE "professional_listings"
  ADD CONSTRAINT "professional_listings_claimedByUserId_fkey"
  FOREIGN KEY ("claimedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "professional_claim_invites" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "invitedByAdminId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_claim_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professional_claim_invites_tokenHash_key" ON "professional_claim_invites"("tokenHash");
CREATE INDEX "professional_claim_invites_professionalListingId_expiresAt_idx" ON "professional_claim_invites"("professionalListingId", "expiresAt");
CREATE INDEX "professional_claim_invites_email_idx" ON "professional_claim_invites"("email");

ALTER TABLE "professional_claim_invites"
  ADD CONSTRAINT "professional_claim_invites_professionalListingId_fkey"
  FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_claim_invites"
  ADD CONSTRAINT "professional_claim_invites_invitedByAdminId_fkey"
  FOREIGN KEY ("invitedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "professional_documents" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "label" TEXT,
    "fileRef" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" "ProfessionalReviewStatus" NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "uploadedByUserId" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "professional_documents_professionalListingId_reviewStatus_idx" ON "professional_documents"("professionalListingId", "reviewStatus");

ALTER TABLE "professional_documents"
  ADD CONSTRAINT "professional_documents_professionalListingId_fkey"
  FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "professional_documents"
  ADD CONSTRAINT "professional_documents_reviewedByAdminId_fkey"
  FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
