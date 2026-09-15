-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('individual', 'firm');

-- CreateEnum
CREATE TYPE "ProfessionalListingStatus" AS ENUM ('draft', 'listed', 'hidden', 'archived');

-- CreateEnum
CREATE TYPE "ProfessionalOwnershipStatus" AS ENUM ('unclaimed', 'claim_pending', 'claimed');

-- CreateEnum
CREATE TYPE "ProfessionalVerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ProfessionalProcurementStatus" AS ENUM ('not_assessed', 'reviewing', 'ready', 'hold', 'blocked');

-- CreateEnum
CREATE TYPE "ProfessionalSourceType" AS ENUM ('admin_research', 'self_submitted', 'claimed', 'referral', 'used_by_bmh');

-- CreateEnum
CREATE TYPE "ProfessionalVerificationMode" AS ENUM ('regulator', 'documents');

-- CreateEnum
CREATE TYPE "ProfessionalReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ProfessionalCredentialStatus" AS ENUM ('current', 'expiring_soon', 'expired', 'unknown');

-- CreateEnum
CREATE TYPE "ProfessionalCredentialVerification" AS ENUM ('unchecked', 'pending', 'checked', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ProfessionalAvailabilityStatus" AS ENUM ('unknown', 'available', 'limited', 'unavailable');

-- CreateEnum
CREATE TYPE "ProfessionalEngagementStatus" AS ENUM ('draft', 'requested', 'assigned', 'in_progress', 'delivered', 'reviewed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ProfessionalEnquiryStatus" AS ENUM ('new', 'reviewing', 'contacted', 'closed');

-- CreateTable
CREATE TABLE "profession_catalog" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "regulatorKey" TEXT,
    "regulatorLabel" TEXT,
    "verificationMode" "ProfessionalVerificationMode" NOT NULL DEFAULT 'documents',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profession_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profession_specialties" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profession_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profession_services" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profession_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profession_deliverables" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profession_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_project_stages" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_project_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_needs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "primaryProfessionId" TEXT NOT NULL,
    "serviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_listings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "professionalType" "ProfessionalType" NOT NULL DEFAULT 'individual',
    "primaryProfessionId" TEXT NOT NULL,
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "stateKey" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "serviceStates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceCities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remoteConsultation" BOOLEAN NOT NULL DEFAULT false,
    "siteVisits" BOOLEAN NOT NULL DEFAULT false,
    "canIssueSignedReport" BOOLEAN NOT NULL DEFAULT false,
    "publicPhone" BOOLEAN NOT NULL DEFAULT false,
    "publicEmail" BOOLEAN NOT NULL DEFAULT false,
    "publicWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "publicWebsite" BOOLEAN NOT NULL DEFAULT true,
    "listingStatus" "ProfessionalListingStatus" NOT NULL DEFAULT 'draft',
    "ownershipStatus" "ProfessionalOwnershipStatus" NOT NULL DEFAULT 'unclaimed',
    "verificationStatus" "ProfessionalVerificationStatus" NOT NULL DEFAULT 'unverified',
    "procurementStatus" "ProfessionalProcurementStatus" NOT NULL DEFAULT 'not_assessed',
    "usedByBmh" BOOLEAN NOT NULL DEFAULT false,
    "usedByBmhSince" TIMESTAMP(3),
    "usedByBmhNote" TEXT,
    "linkedUserId" TEXT,
    "sourceType" "ProfessionalSourceType" NOT NULL DEFAULT 'admin_research',
    "sourceNotes" TEXT,
    "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completenessScore" INTEGER NOT NULL DEFAULT 0,
    "searchRank" INTEGER NOT NULL DEFAULT 0,
    "normalizedName" TEXT,
    "normalizedPhone" TEXT,
    "normalizedEmail" TEXT,
    "websiteDomain" TEXT,
    "createdByAdminId" TEXT,
    "listedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_listing_specialties" (
    "professionalListingId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "professional_listing_specialties_pkey" PRIMARY KEY ("professionalListingId","specialtyId")
);

-- CreateTable
CREATE TABLE "professional_listing_services" (
    "professionalListingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "professional_listing_services_pkey" PRIMARY KEY ("professionalListingId","serviceId")
);

-- CreateTable
CREATE TABLE "professional_listing_deliverables" (
    "professionalListingId" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,

    CONSTRAINT "professional_listing_deliverables_pkey" PRIMARY KEY ("professionalListingId","deliverableId")
);

-- CreateTable
CREATE TABLE "professional_listing_stages" (
    "professionalListingId" TEXT NOT NULL,
    "projectStageId" TEXT NOT NULL,

    CONSTRAINT "professional_listing_stages_pkey" PRIMARY KEY ("professionalListingId","projectStageId")
);

-- CreateTable
CREATE TABLE "professional_credentials" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "regulatorKey" TEXT,
    "regulatorLabel" TEXT,
    "registrationNumber" TEXT,
    "normalizedRegKey" TEXT,
    "holderName" TEXT,
    "holderType" "ProfessionalType" NOT NULL DEFAULT 'individual',
    "credentialStatus" "ProfessionalCredentialStatus" NOT NULL DEFAULT 'unknown',
    "verificationStatus" "ProfessionalCredentialVerification" NOT NULL DEFAULT 'unchecked',
    "verificationSourceUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedByAdminId" TEXT,
    "verificationNotes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_credential_documents" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileRef" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "uploadedBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_credential_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_procurement_profiles" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT NOT NULL,
    "availabilityStatus" "ProfessionalAvailabilityStatus" NOT NULL DEFAULT 'unknown',
    "inspectionFee" DECIMAL(12,2),
    "reportFee" DECIMAL(12,2),
    "consultationFee" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "travelFeeNotes" TEXT,
    "rateNotes" TEXT,
    "typicalTurnaroundHours" INTEGER,
    "acceptsBmhNegotiatedRates" BOOLEAN NOT NULL DEFAULT false,
    "capabilityTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastContactedAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_procurement_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_engagements" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "purpose" TEXT NOT NULL,
    "serviceId" TEXT,
    "requiredDeliverableId" TEXT,
    "fee" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "ProfessionalEngagementStatus" NOT NULL DEFAULT 'draft',
    "requestedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reportUrl" TEXT,
    "reportNotes" TEXT,
    "professionalRecommendation" TEXT,
    "internalDecisionNotes" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_applications" (
    "id" TEXT NOT NULL,
    "professionalType" "ProfessionalType" NOT NULL DEFAULT 'individual',
    "displayName" TEXT NOT NULL,
    "professionId" TEXT,
    "specialtyKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serviceKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "state" TEXT,
    "city" TEXT,
    "regulatorKey" TEXT,
    "registrationNumber" TEXT,
    "shortDescription" TEXT,
    "status" "ProfessionalReviewStatus" NOT NULL DEFAULT 'pending',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdListingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_claim_requests" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "relationshipToPractice" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "proofMethod" TEXT,
    "proofNotes" TEXT,
    "status" "ProfessionalReviewStatus" NOT NULL DEFAULT 'pending',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_claim_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_enquiries" (
    "id" TEXT NOT NULL,
    "professionalListingId" TEXT,
    "requesterName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "propertyState" TEXT,
    "propertyCity" TEXT,
    "whatDoYouNeed" TEXT NOT NULL,
    "message" TEXT,
    "status" "ProfessionalEnquiryStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profession_catalog_key_key" ON "profession_catalog"("key");

-- CreateIndex
CREATE INDEX "profession_catalog_isActive_sortOrder_idx" ON "profession_catalog"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "profession_specialties_key_key" ON "profession_specialties"("key");

-- CreateIndex
CREATE INDEX "profession_specialties_professionId_isActive_sortOrder_idx" ON "profession_specialties"("professionId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "profession_services_key_key" ON "profession_services"("key");

-- CreateIndex
CREATE INDEX "profession_services_isActive_sortOrder_idx" ON "profession_services"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "profession_deliverables_key_key" ON "profession_deliverables"("key");

-- CreateIndex
CREATE INDEX "profession_deliverables_isActive_sortOrder_idx" ON "profession_deliverables"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "professional_project_stages_key_key" ON "professional_project_stages"("key");

-- CreateIndex
CREATE INDEX "professional_project_stages_isActive_sortOrder_idx" ON "professional_project_stages"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "professional_needs_key_key" ON "professional_needs"("key");

-- CreateIndex
CREATE INDEX "professional_needs_isActive_sortOrder_idx" ON "professional_needs"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "professional_listings_slug_key" ON "professional_listings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "professional_listings_linkedUserId_key" ON "professional_listings"("linkedUserId");

-- CreateIndex
CREATE INDEX "professional_listings_listingStatus_verificationStatus_idx" ON "professional_listings"("listingStatus", "verificationStatus");

-- CreateIndex
CREATE INDEX "professional_listings_primaryProfessionId_listingStatus_idx" ON "professional_listings"("primaryProfessionId", "listingStatus");

-- CreateIndex
CREATE INDEX "professional_listings_stateKey_listingStatus_idx" ON "professional_listings"("stateKey", "listingStatus");

-- CreateIndex
CREATE INDEX "professional_listings_usedByBmh_listingStatus_idx" ON "professional_listings"("usedByBmh", "listingStatus");

-- CreateIndex
CREATE INDEX "professional_listings_ownershipStatus_idx" ON "professional_listings"("ownershipStatus");

-- CreateIndex
CREATE INDEX "professional_listings_searchRank_displayName_idx" ON "professional_listings"("searchRank", "displayName");

-- CreateIndex
CREATE INDEX "professional_listings_normalizedName_idx" ON "professional_listings"("normalizedName");

-- CreateIndex
CREATE INDEX "professional_listings_normalizedPhone_idx" ON "professional_listings"("normalizedPhone");

-- CreateIndex
CREATE INDEX "professional_listings_normalizedEmail_idx" ON "professional_listings"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "professional_credentials_normalizedRegKey_key" ON "professional_credentials"("normalizedRegKey");

-- CreateIndex
CREATE INDEX "professional_credentials_professionalListingId_isPrimary_idx" ON "professional_credentials"("professionalListingId", "isPrimary");

-- CreateIndex
CREATE INDEX "professional_credentials_regulatorKey_registrationNumber_idx" ON "professional_credentials"("regulatorKey", "registrationNumber");

-- CreateIndex
CREATE INDEX "professional_credential_documents_credentialId_idx" ON "professional_credential_documents"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_procurement_profiles_professionalListingId_key" ON "professional_procurement_profiles"("professionalListingId");

-- CreateIndex
CREATE INDEX "professional_engagements_professionalListingId_createdAt_idx" ON "professional_engagements"("professionalListingId", "createdAt");

-- CreateIndex
CREATE INDEX "professional_engagements_projectId_stageId_idx" ON "professional_engagements"("projectId", "stageId");

-- CreateIndex
CREATE INDEX "professional_engagements_status_dueAt_idx" ON "professional_engagements"("status", "dueAt");

-- CreateIndex
CREATE INDEX "professional_applications_status_createdAt_idx" ON "professional_applications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "professional_claim_requests_professionalListingId_status_idx" ON "professional_claim_requests"("professionalListingId", "status");

-- CreateIndex
CREATE INDEX "professional_claim_requests_status_createdAt_idx" ON "professional_claim_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "professional_enquiries_status_createdAt_idx" ON "professional_enquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "professional_enquiries_professionalListingId_createdAt_idx" ON "professional_enquiries"("professionalListingId", "createdAt");

-- AddForeignKey
ALTER TABLE "profession_specialties" ADD CONSTRAINT "profession_specialties_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "profession_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_needs" ADD CONSTRAINT "professional_needs_primaryProfessionId_fkey" FOREIGN KEY ("primaryProfessionId") REFERENCES "profession_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_needs" ADD CONSTRAINT "professional_needs_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "profession_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listings" ADD CONSTRAINT "professional_listings_primaryProfessionId_fkey" FOREIGN KEY ("primaryProfessionId") REFERENCES "profession_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listings" ADD CONSTRAINT "professional_listings_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listings" ADD CONSTRAINT "professional_listings_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_specialties" ADD CONSTRAINT "professional_listing_specialties_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_specialties" ADD CONSTRAINT "professional_listing_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "profession_specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_services" ADD CONSTRAINT "professional_listing_services_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_services" ADD CONSTRAINT "professional_listing_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "profession_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_deliverables" ADD CONSTRAINT "professional_listing_deliverables_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_deliverables" ADD CONSTRAINT "professional_listing_deliverables_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "profession_deliverables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_stages" ADD CONSTRAINT "professional_listing_stages_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_listing_stages" ADD CONSTRAINT "professional_listing_stages_projectStageId_fkey" FOREIGN KEY ("projectStageId") REFERENCES "professional_project_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_credentials" ADD CONSTRAINT "professional_credentials_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_credentials" ADD CONSTRAINT "professional_credentials_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_credential_documents" ADD CONSTRAINT "professional_credential_documents_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "professional_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_procurement_profiles" ADD CONSTRAINT "professional_procurement_profiles_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_engagements" ADD CONSTRAINT "professional_engagements_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_engagements" ADD CONSTRAINT "professional_engagements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_engagements" ADD CONSTRAINT "professional_engagements_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_engagements" ADD CONSTRAINT "professional_engagements_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "profession_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_engagements" ADD CONSTRAINT "professional_engagements_requiredDeliverableId_fkey" FOREIGN KEY ("requiredDeliverableId") REFERENCES "profession_deliverables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_engagements" ADD CONSTRAINT "professional_engagements_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_applications" ADD CONSTRAINT "professional_applications_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "profession_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_applications" ADD CONSTRAINT "professional_applications_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_applications" ADD CONSTRAINT "professional_applications_createdListingId_fkey" FOREIGN KEY ("createdListingId") REFERENCES "professional_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_claim_requests" ADD CONSTRAINT "professional_claim_requests_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_claim_requests" ADD CONSTRAINT "professional_claim_requests_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_enquiries" ADD CONSTRAINT "professional_enquiries_professionalListingId_fkey" FOREIGN KEY ("professionalListingId") REFERENCES "professional_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

