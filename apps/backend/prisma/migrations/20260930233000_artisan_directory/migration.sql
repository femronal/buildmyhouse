-- Artisan directory. Publication is controlled by listing status, not trust score.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "artisanClaimAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "listingManagementIntroSeenAt" TIMESTAMP(3);
ALTER TABLE "contractors" ADD COLUMN IF NOT EXISTS "platformKind" TEXT NOT NULL DEFAULT 'general_contractor';

CREATE TYPE "ArtisanListingStatus" AS ENUM ('listed', 'hidden', 'archived');
CREATE TYPE "ArtisanClaimStatus" AS ENUM ('unclaimed', 'claim_pending', 'claimed');
CREATE TYPE "ArtisanVerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');
CREATE TYPE "ArtisanRecruitmentStatus" AS ENUM ('discovered', 'researched', 'contacted', 'claim_invited', 'claimed', 'verification_pending', 'ready_for_jobs', 'active', 'temporarily_unavailable', 'paused', 'blocked');
CREATE TYPE "ArtisanSourceType" AS ENUM ('grok_research', 'admin_research', 'self_submitted', 'claimed', 'referral', 'used_by_bmh');
CREATE TYPE "ArtisanCapabilityKind" AS ENUM ('specialty', 'service', 'problem');
CREATE TYPE "ArtisanMediaType" AS ENUM ('logo', 'workshop_cover', 'workshop', 'work_gallery', 'before', 'after');
CREATE TYPE "ArtisanMediaReviewStatus" AS ENUM ('uploaded', 'reviewed', 'rejected');
CREATE TYPE "ArtisanVerificationCheckKey" AS ENUM ('identity_checked', 'phone_checked', 'work_base_checked', 'trade_evidence_checked', 'business_registration_checked', 'references_checked', 'bmh_interview_completed');
CREATE TYPE "ArtisanCheckStatus" AS ENUM ('pending', 'passed', 'failed', 'not_applicable');
CREATE TYPE "ArtisanReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "artisan_trades" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_trades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "artisan_trades_key_key" ON "artisan_trades"("key");

CREATE TABLE "artisan_capabilities" (
  "id" TEXT NOT NULL,
  "tradeId" TEXT NOT NULL,
  "kind" "ArtisanCapabilityKind" NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "professionalNote" TEXT,
  "professionalHref" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_capabilities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "artisan_capabilities_tradeId_kind_key_key" ON "artisan_capabilities"("tradeId", "kind", "key");
CREATE INDEX "artisan_capabilities_kind_key_idx" ON "artisan_capabilities"("kind", "key");
ALTER TABLE "artisan_capabilities" ADD CONSTRAINT "artisan_capabilities_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "artisan_trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "artisan_problem_services" (
  "problemId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  CONSTRAINT "artisan_problem_services_pkey" PRIMARY KEY ("problemId", "serviceId")
);
ALTER TABLE "artisan_problem_services" ADD CONSTRAINT "artisan_problem_services_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "artisan_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisan_problem_services" ADD CONSTRAINT "artisan_problem_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "artisan_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "artisan_listings" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "businessName" TEXT,
  "primaryTradeId" TEXT NOT NULL,
  "bio" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "whatsapp" TEXT,
  "website" TEXT,
  "publicPhone" BOOLEAN NOT NULL DEFAULT true,
  "publicEmail" BOOLEAN NOT NULL DEFAULT false,
  "publicWhatsapp" BOOLEAN NOT NULL DEFAULT true,
  "publicWebsite" BOOLEAN NOT NULL DEFAULT true,
  "workingHours" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Nigeria',
  "serviceStates" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "serviceCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "listingStatus" "ArtisanListingStatus" NOT NULL DEFAULT 'listed',
  "claimStatus" "ArtisanClaimStatus" NOT NULL DEFAULT 'unclaimed',
  "verificationStatus" "ArtisanVerificationStatus" NOT NULL DEFAULT 'unverified',
  "recruitmentStatus" "ArtisanRecruitmentStatus" NOT NULL DEFAULT 'discovered',
  "linkedUserId" TEXT,
  "linkedContractorId" TEXT,
  "claimedAt" TIMESTAMP(3),
  "usedByBmh" BOOLEAN NOT NULL DEFAULT false,
  "usedByBmhNote" TEXT,
  "usedByBmhSince" TIMESTAMP(3),
  "trustScore" INTEGER NOT NULL DEFAULT 0,
  "sourceType" "ArtisanSourceType" NOT NULL DEFAULT 'admin_research',
  "sourceNotes" TEXT,
  "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastResearchedAt" TIMESTAMP(3),
  "normalizedName" TEXT,
  "normalizedPhone" TEXT,
  "normalizedWhatsapp" TEXT,
  "normalizedEmail" TEXT,
  "websiteDomain" TEXT,
  "availabilityNotes" TEXT,
  "callOutFeeNotes" TEXT,
  "inspectionFeeNotes" TEXT,
  "workmanshipNotes" TEXT,
  "transportNotes" TEXT,
  "emergencyJobs" BOOLEAN NOT NULL DEFAULT false,
  "sameDayJobs" BOOLEAN NOT NULL DEFAULT false,
  "weekendWork" BOOLEAN NOT NULL DEFAULT false,
  "crewSize" INTEGER,
  "hasWorkshop" BOOLEAN NOT NULL DEFAULT false,
  "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
  "ownsTools" BOOLEAN NOT NULL DEFAULT false,
  "canIssueInvoice" BOOLEAN NOT NULL DEFAULT false,
  "residentialExperience" BOOLEAN NOT NULL DEFAULT true,
  "commercialExperience" BOOLEAN NOT NULL DEFAULT false,
  "lastContactedAt" TIMESTAMP(3),
  "internalNotes" TEXT,
  "createdByAdminId" TEXT,
  "listedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_listings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "artisan_listings_slug_key" ON "artisan_listings"("slug");
CREATE INDEX "artisan_listings_listingStatus_primaryTradeId_idx" ON "artisan_listings"("listingStatus", "primaryTradeId");
CREATE INDEX "artisan_listings_state_city_idx" ON "artisan_listings"("state", "city");
CREATE INDEX "artisan_listings_claimStatus_idx" ON "artisan_listings"("claimStatus");
CREATE INDEX "artisan_listings_verificationStatus_idx" ON "artisan_listings"("verificationStatus");
CREATE INDEX "artisan_listings_recruitmentStatus_idx" ON "artisan_listings"("recruitmentStatus");
CREATE INDEX "artisan_listings_normalizedPhone_idx" ON "artisan_listings"("normalizedPhone");
CREATE INDEX "artisan_listings_normalizedWhatsapp_idx" ON "artisan_listings"("normalizedWhatsapp");
CREATE INDEX "artisan_listings_normalizedEmail_idx" ON "artisan_listings"("normalizedEmail");
CREATE INDEX "artisan_listings_normalizedName_idx" ON "artisan_listings"("normalizedName");
ALTER TABLE "artisan_listings" ADD CONSTRAINT "artisan_listings_primaryTradeId_fkey" FOREIGN KEY ("primaryTradeId") REFERENCES "artisan_trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "artisan_listings" ADD CONSTRAINT "artisan_listings_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "artisan_listings" ADD CONSTRAINT "artisan_listings_linkedContractorId_fkey" FOREIGN KEY ("linkedContractorId") REFERENCES "contractors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "artisan_listings" ADD CONSTRAINT "artisan_listings_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "artisan_listing_capabilities" (
  "artisanListingId" TEXT NOT NULL,
  "capabilityId" TEXT NOT NULL,
  CONSTRAINT "artisan_listing_capabilities_pkey" PRIMARY KEY ("artisanListingId", "capabilityId")
);
ALTER TABLE "artisan_listing_capabilities" ADD CONSTRAINT "artisan_listing_capabilities_artisanListingId_fkey" FOREIGN KEY ("artisanListingId") REFERENCES "artisan_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisan_listing_capabilities" ADD CONSTRAINT "artisan_listing_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "artisan_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "artisan_media" (
  "id" TEXT NOT NULL,
  "artisanListingId" TEXT NOT NULL,
  "mediaType" "ArtisanMediaType" NOT NULL,
  "fileRef" TEXT NOT NULL,
  "label" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "reviewStatus" "ArtisanMediaReviewStatus" NOT NULL DEFAULT 'uploaded',
  "rejectionReason" TEXT,
  "uploadedByUserId" TEXT,
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "artisan_media_artisanListingId_mediaType_idx" ON "artisan_media"("artisanListingId", "mediaType");
ALTER TABLE "artisan_media" ADD CONSTRAINT "artisan_media_artisanListingId_fkey" FOREIGN KEY ("artisanListingId") REFERENCES "artisan_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisan_media" ADD CONSTRAINT "artisan_media_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "artisan_verification_checks" (
  "id" TEXT NOT NULL,
  "artisanListingId" TEXT NOT NULL,
  "checkKey" "ArtisanVerificationCheckKey" NOT NULL,
  "status" "ArtisanCheckStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "evidenceFileRef" TEXT,
  "checkedByAdminId" TEXT,
  "checkedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_verification_checks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "artisan_verification_checks_artisanListingId_checkKey_idx" ON "artisan_verification_checks"("artisanListingId", "checkKey");
ALTER TABLE "artisan_verification_checks" ADD CONSTRAINT "artisan_verification_checks_artisanListingId_fkey" FOREIGN KEY ("artisanListingId") REFERENCES "artisan_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisan_verification_checks" ADD CONSTRAINT "artisan_verification_checks_checkedByAdminId_fkey" FOREIGN KEY ("checkedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "artisan_claim_invites" (
  "id" TEXT NOT NULL,
  "artisanListingId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "invitedByAdminId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "artisan_claim_invites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "artisan_claim_invites_tokenHash_key" ON "artisan_claim_invites"("tokenHash");
CREATE INDEX "artisan_claim_invites_artisanListingId_expiresAt_idx" ON "artisan_claim_invites"("artisanListingId", "expiresAt");
ALTER TABLE "artisan_claim_invites" ADD CONSTRAINT "artisan_claim_invites_artisanListingId_fkey" FOREIGN KEY ("artisanListingId") REFERENCES "artisan_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisan_claim_invites" ADD CONSTRAINT "artisan_claim_invites_invitedByAdminId_fkey" FOREIGN KEY ("invitedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "artisan_claim_requests" (
  "id" TEXT NOT NULL,
  "artisanListingId" TEXT NOT NULL,
  "requesterUserId" TEXT,
  "requesterName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "status" "ArtisanReviewStatus" NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_claim_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "artisan_claim_requests_artisanListingId_status_idx" ON "artisan_claim_requests"("artisanListingId", "status");
ALTER TABLE "artisan_claim_requests" ADD CONSTRAINT "artisan_claim_requests_artisanListingId_fkey" FOREIGN KEY ("artisanListingId") REFERENCES "artisan_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artisan_claim_requests" ADD CONSTRAINT "artisan_claim_requests_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "artisan_claim_requests" ADD CONSTRAINT "artisan_claim_requests_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "artisan_applications" (
  "id" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "businessName" TEXT,
  "tradeKey" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "whatsapp" TEXT,
  "city" TEXT,
  "state" TEXT,
  "bio" TEXT,
  "serviceLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ArtisanReviewStatus" NOT NULL DEFAULT 'pending',
  "createdListingId" TEXT,
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "artisan_applications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "artisan_applications_status_createdAt_idx" ON "artisan_applications"("status", "createdAt");

INSERT INTO "hr_admin_permissions" ("id", "key", "groupLabel", "description", "isCritical", "createdAt")
SELECT gen_random_uuid()::text, v.key, 'Artisans', v.description, v.critical, CURRENT_TIMESTAMP
FROM (VALUES
  ('artisans.view', 'View artisan listings and recruitment records', false),
  ('artisans.create', 'Create artisan listings that publish immediately', false),
  ('artisans.edit', 'Edit artisan listings, recruitment notes and media review', false),
  ('artisans.review', 'Review artisan applications and claim requests', true),
  ('artisans.verify', 'Record artisan verification decisions', true)
) AS v(key, description, critical)
WHERE NOT EXISTS (SELECT 1 FROM "hr_admin_permissions" p WHERE p."key" = v.key);

INSERT INTO "hr_admin_role_permissions" ("id", "roleId", "permissionId")
SELECT gen_random_uuid()::text, rp."roleId", newp."id"
FROM "hr_admin_role_permissions" rp
JOIN "hr_admin_permissions" oldp ON oldp."id" = rp."permissionId" AND oldp."key" = 'professionals.view'
JOIN "hr_admin_permissions" newp ON newp."key" LIKE 'artisans.%'
WHERE NOT EXISTS (
  SELECT 1 FROM "hr_admin_role_permissions" existing
  WHERE existing."roleId" = rp."roleId" AND existing."permissionId" = newp."id"
);
