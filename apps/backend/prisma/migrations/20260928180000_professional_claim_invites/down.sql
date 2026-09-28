-- Manual reverse of 20260928180000_professional_claim_invites.
-- Stop if any professional_credentials.verificationStatus is needs_recheck.
-- PostgreSQL cannot drop a single enum value in place.

ALTER TABLE "professional_documents" DROP CONSTRAINT IF EXISTS "professional_documents_reviewedByAdminId_fkey";
ALTER TABLE "professional_documents" DROP CONSTRAINT IF EXISTS "professional_documents_professionalListingId_fkey";
DROP TABLE IF EXISTS "professional_documents";

ALTER TABLE "professional_claim_invites" DROP CONSTRAINT IF EXISTS "professional_claim_invites_invitedByAdminId_fkey";
ALTER TABLE "professional_claim_invites" DROP CONSTRAINT IF EXISTS "professional_claim_invites_professionalListingId_fkey";
DROP TABLE IF EXISTS "professional_claim_invites";

ALTER TABLE "professional_listings" DROP CONSTRAINT IF EXISTS "professional_listings_claimedByUserId_fkey";
DROP INDEX IF EXISTS "professional_listings_claimedByUserId_key";
ALTER TABLE "professional_listings" DROP COLUMN IF EXISTS "claimedAt";
ALTER TABLE "professional_listings" DROP COLUMN IF EXISTS "claimEmail";
ALTER TABLE "professional_listings" DROP COLUMN IF EXISTS "claimedByUserId";
