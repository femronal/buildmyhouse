-- CreateEnum
CREATE TYPE "VendorListingStatus" AS ENUM ('draft', 'submitted', 'under_review', 'clarification_required', 'listed', 'rejected', 'suspended', 'internal_only');

-- CreateEnum
CREATE TYPE "VendorVerificationStatus" AS ENUM ('unverified', 'partial', 'verified', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "VendorClaimStatus" AS ENUM ('unclaimed', 'invite_sent', 'claim_pending_admin', 'claimed');

-- CreateEnum
CREATE TYPE "VendorAcquisitionSource" AS ENUM ('vendor_self_signup', 'admin_manual', 'whatsapp', 'project_supplier', 'contractor_referral', 'customer_referral', 'field_team', 'imported', 'other');

-- CreateEnum
CREATE TYPE "VendorProcurementRelationship" AS ENUM ('never_contacted', 'contacted', 'quoted', 'purchased_from', 'preferred', 'do_not_use');

-- CreateEnum
CREATE TYPE "VendorDocumentType" AS ENUM ('cac_certificate', 'government_id', 'proof_of_address', 'storefront_photo', 'warehouse_photo', 'price_list', 'tax_id', 'bank_account_proof', 'logo', 'other');

-- CreateEnum
CREATE TYPE "VendorDocumentReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "VendorVerificationCheckKey" AS ENUM ('business_identity', 'business_registration', 'representative_identity', 'phone', 'location_evidence', 'product_categories', 'supporting_evidence');

-- CreateEnum
CREATE TYPE "VendorVerificationCheckStatus" AS ENUM ('not_started', 'pending', 'passed', 'failed', 'not_applicable', 'expired');

-- CreateEnum
CREATE TYPE "VendorActivityType" AS ENUM ('contacted', 'quotation_requested', 'quotation_received', 'purchase_completed', 'verification_call', 'profile_correction', 'clarification_requested', 'clarification_received', 'complaint', 'suspension', 'restoration', 'note', 'invitation_sent', 'claim_accepted', 'listing_approved', 'verification_completed', 'other');

-- CreateEnum
CREATE TYPE "VendorChangeRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'applied', 'withdrawn');

-- CreateEnum
CREATE TYPE "VendorPreferredContactMethod" AS ENUM ('phone', 'whatsapp', 'email');

-- CreateEnum
CREATE TYPE "VendorQuoteRequestStatus" AS ENUM ('new', 'notified', 'closed', 'spam');

-- CreateEnum
CREATE TYPE "VendorAddressVisibility" AS ENUM ('public_city_state_only', 'public_full_address', 'private');

-- CreateTable
CREATE TABLE "vendor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "slug" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL,
    "legalName" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "yearEstablished" INTEGER,
    "businessTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "listingStatus" "VendorListingStatus" NOT NULL DEFAULT 'draft',
    "verificationStatus" "VendorVerificationStatus" NOT NULL DEFAULT 'unverified',
    "claimStatus" "VendorClaimStatus" NOT NULL DEFAULT 'unclaimed',
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "applicationReference" TEXT,
    "acquisitionSource" "VendorAcquisitionSource" NOT NULL DEFAULT 'admin_manual',
    "acquisitionNote" TEXT,
    "publicPhone" TEXT,
    "publicWhatsApp" TEXT,
    "publicEmail" TEXT,
    "showPublicPhone" BOOLEAN NOT NULL DEFAULT true,
    "showPublicWhatsApp" BOOLEAN NOT NULL DEFAULT true,
    "showPublicEmail" BOOLEAN NOT NULL DEFAULT false,
    "websiteUrl" TEXT,
    "socialLinks" JSONB,
    "preferredContactMethod" "VendorPreferredContactMethod",
    "salesContactName" TEXT,
    "procurementContactName" TEXT,
    "quotationEmail" TEXT,
    "businessHours" TEXT,
    "afterHoursAvailable" BOOLEAN NOT NULL DEFAULT false,
    "acceptsSmallOrders" BOOLEAN NOT NULL DEFAULT true,
    "acceptsBulkOrders" BOOLEAN NOT NULL DEFAULT true,
    "acceptsProjectQuotations" BOOLEAN NOT NULL DEFAULT true,
    "canSupplyBoqQuotations" BOOLEAN NOT NULL DEFAULT false,
    "canSourceUnstocked" BOOLEAN NOT NULL DEFAULT false,
    "deliveryFleetAvailable" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyDelivery" BOOLEAN NOT NULL DEFAULT false,
    "pickupAvailable" BOOLEAN NOT NULL DEFAULT true,
    "interstateDelivery" BOOLEAN NOT NULL DEFAULT false,
    "installationAvailable" BOOLEAN NOT NULL DEFAULT false,
    "afterSalesSupport" BOOLEAN NOT NULL DEFAULT false,
    "warrantyHandling" BOOLEAN NOT NULL DEFAULT false,
    "nationwideDelivery" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethodsAccepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depositRequired" BOOLEAN,
    "creditTermsNotes" TEXT,
    "priceListAvailable" BOOLEAN NOT NULL DEFAULT false,
    "priceListUrl" TEXT,
    "priceListUpdatedAt" TIMESTAMP(3),
    "typicalQuoteResponseHours" INTEGER,
    "pricesNegotiable" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "stateKey" TEXT,
    "stateLabel" TEXT,
    "cityKey" TEXT,
    "cityLabel" TEXT,
    "lgaLabel" TEXT,
    "localAreaLabel" TEXT,
    "publicAddress" TEXT,
    "privateBusinessAddress" TEXT,
    "addressVisibility" "VendorAddressVisibility" NOT NULL DEFAULT 'public_city_state_only',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cacRegistrationStatus" TEXT,
    "cacNumber" TEXT,
    "taxIdentificationNumber" TEXT,
    "bankAccountName" TEXT,
    "normalizedTradingName" TEXT,
    "normalizedPhone" TEXT,
    "normalizedWhatsApp" TEXT,
    "normalizedEmail" TEXT,
    "websiteDomain" TEXT,
    "clarificationMessage" TEXT,
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "procurementRelationship" "VendorProcurementRelationship" NOT NULL DEFAULT 'never_contacted',
    "previouslyUsedByBmh" BOOLEAN NOT NULL DEFAULT false,
    "createdByAdminId" TEXT,
    "approvedByAdminId" TEXT,
    "verifiedByAdminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "listedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_representatives" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "showPublicly" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_representatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_offerings" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "familyKey" TEXT,
    "categoryCode" TEXT,
    "customCategoryLabel" TEXT,
    "productTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "brands" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sellsRetail" BOOLEAN NOT NULL DEFAULT true,
    "sellsWholesale" BOOLEAN NOT NULL DEFAULT false,
    "normalUnit" TEXT,
    "minimumOrderQuantity" DOUBLE PRECISION,
    "minimumOrderUnit" TEXT,
    "stockedNormally" BOOLEAN NOT NULL DEFAULT true,
    "specialOrder" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
    "installationAvailable" BOOLEAN NOT NULL DEFAULT false,
    "acceptsQuotations" BOOLEAN NOT NULL DEFAULT true,
    "quantityBreakNotes" TEXT,
    "pricesNegotiable" BOOLEAN NOT NULL DEFAULT true,
    "deliveryIncluded" BOOLEAN,
    "deliveryPricingMethod" TEXT,
    "installationIncluded" BOOLEAN,
    "vatStatus" TEXT,
    "priceValidityNotes" TEXT,
    "examplePriceAmount" DECIMAL(14,2),
    "examplePriceCurrency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "examplePriceUnit" TEXT,
    "examplePriceNotes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_service_areas" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "locationKey" TEXT,
    "stateKey" TEXT,
    "stateLabel" TEXT,
    "cityKey" TEXT,
    "cityLabel" TEXT,
    "coverageType" TEXT NOT NULL DEFAULT 'delivery',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_documents" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "documentType" "VendorDocumentType" NOT NULL,
    "label" TEXT,
    "fileRef" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "reviewStatus" "VendorDocumentReviewStatus" NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_verification_checks" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "checkKey" "VendorVerificationCheckKey" NOT NULL,
    "status" "VendorVerificationCheckStatus" NOT NULL DEFAULT 'not_started',
    "evidenceDocumentId" TEXT,
    "notes" TEXT,
    "failureReason" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reverifyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_verification_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_admin_notes" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "authorAdminId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_activities" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "type" "VendorActivityType" NOT NULL,
    "summary" TEXT,
    "note" TEXT,
    "projectId" TEXT,
    "actorAdminId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_claim_invites" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "invitedByAdminId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_claim_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_quote_requests" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "specification" TEXT,
    "quantity" TEXT,
    "deliveryLocation" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "projectId" TEXT,
    "note" TEXT,
    "status" "VendorQuoteRequestStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_profile_change_requests" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "fieldGroup" TEXT NOT NULL,
    "proposedPayload" JSONB NOT NULL,
    "currentPayload" JSONB,
    "status" "VendorChangeRequestStatus" NOT NULL DEFAULT 'pending',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_profile_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_profiles_userId_key" ON "vendor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_profiles_slug_key" ON "vendor_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_profiles_applicationReference_key" ON "vendor_profiles"("applicationReference");

-- CreateIndex
CREATE INDEX "vendor_profiles_listingStatus_verificationStatus_idx" ON "vendor_profiles"("listingStatus", "verificationStatus");

-- CreateIndex
CREATE INDEX "vendor_profiles_listingStatus_stateKey_idx" ON "vendor_profiles"("listingStatus", "stateKey");

-- CreateIndex
CREATE INDEX "vendor_profiles_claimStatus_idx" ON "vendor_profiles"("claimStatus");

-- CreateIndex
CREATE INDEX "vendor_profiles_acquisitionSource_idx" ON "vendor_profiles"("acquisitionSource");

-- CreateIndex
CREATE INDEX "vendor_profiles_procurementRelationship_idx" ON "vendor_profiles"("procurementRelationship");

-- CreateIndex
CREATE INDEX "vendor_profiles_normalizedPhone_idx" ON "vendor_profiles"("normalizedPhone");

-- CreateIndex
CREATE INDEX "vendor_profiles_normalizedWhatsApp_idx" ON "vendor_profiles"("normalizedWhatsApp");

-- CreateIndex
CREATE INDEX "vendor_profiles_normalizedEmail_idx" ON "vendor_profiles"("normalizedEmail");

-- CreateIndex
CREATE INDEX "vendor_profiles_cacNumber_idx" ON "vendor_profiles"("cacNumber");

-- CreateIndex
CREATE INDEX "vendor_profiles_websiteDomain_idx" ON "vendor_profiles"("websiteDomain");

-- CreateIndex
CREATE INDEX "vendor_profiles_submittedAt_idx" ON "vendor_profiles"("submittedAt");

-- CreateIndex
CREATE INDEX "vendor_profiles_createdAt_idx" ON "vendor_profiles"("createdAt");

-- CreateIndex
CREATE INDEX "vendor_representatives_vendorProfileId_isPrimary_idx" ON "vendor_representatives"("vendorProfileId", "isPrimary");

-- CreateIndex
CREATE INDEX "vendor_offerings_vendorProfileId_idx" ON "vendor_offerings"("vendorProfileId");

-- CreateIndex
CREATE INDEX "vendor_offerings_familyKey_idx" ON "vendor_offerings"("familyKey");

-- CreateIndex
CREATE INDEX "vendor_offerings_categoryCode_idx" ON "vendor_offerings"("categoryCode");

-- CreateIndex
CREATE INDEX "vendor_service_areas_vendorProfileId_idx" ON "vendor_service_areas"("vendorProfileId");

-- CreateIndex
CREATE INDEX "vendor_service_areas_stateKey_idx" ON "vendor_service_areas"("stateKey");

-- CreateIndex
CREATE INDEX "vendor_service_areas_locationKey_idx" ON "vendor_service_areas"("locationKey");

-- CreateIndex
CREATE INDEX "vendor_documents_vendorProfileId_documentType_idx" ON "vendor_documents"("vendorProfileId", "documentType");

-- CreateIndex
CREATE INDEX "vendor_documents_reviewStatus_idx" ON "vendor_documents"("reviewStatus");

-- CreateIndex
CREATE INDEX "vendor_verification_checks_status_idx" ON "vendor_verification_checks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_verification_checks_vendorProfileId_checkKey_key" ON "vendor_verification_checks"("vendorProfileId", "checkKey");

-- CreateIndex
CREATE INDEX "vendor_admin_notes_vendorProfileId_createdAt_idx" ON "vendor_admin_notes"("vendorProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "vendor_activities_vendorProfileId_createdAt_idx" ON "vendor_activities"("vendorProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "vendor_activities_type_createdAt_idx" ON "vendor_activities"("type", "createdAt");

-- CreateIndex
CREATE INDEX "vendor_activities_projectId_idx" ON "vendor_activities"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_claim_invites_tokenHash_key" ON "vendor_claim_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "vendor_claim_invites_vendorProfileId_expiresAt_idx" ON "vendor_claim_invites"("vendorProfileId", "expiresAt");

-- CreateIndex
CREATE INDEX "vendor_claim_invites_email_idx" ON "vendor_claim_invites"("email");

-- CreateIndex
CREATE INDEX "vendor_quote_requests_vendorProfileId_createdAt_idx" ON "vendor_quote_requests"("vendorProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "vendor_quote_requests_status_createdAt_idx" ON "vendor_quote_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "vendor_profile_change_requests_vendorProfileId_status_idx" ON "vendor_profile_change_requests"("vendorProfileId", "status");

-- CreateIndex
CREATE INDEX "vendor_profile_change_requests_status_createdAt_idx" ON "vendor_profile_change_requests"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_verifiedByAdminId_fkey" FOREIGN KEY ("verifiedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_representatives" ADD CONSTRAINT "vendor_representatives_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_offerings" ADD CONSTRAINT "vendor_offerings_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_service_areas" ADD CONSTRAINT "vendor_service_areas_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_verification_checks" ADD CONSTRAINT "vendor_verification_checks_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_verification_checks" ADD CONSTRAINT "vendor_verification_checks_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_admin_notes" ADD CONSTRAINT "vendor_admin_notes_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_admin_notes" ADD CONSTRAINT "vendor_admin_notes_authorAdminId_fkey" FOREIGN KEY ("authorAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_activities" ADD CONSTRAINT "vendor_activities_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_activities" ADD CONSTRAINT "vendor_activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_activities" ADD CONSTRAINT "vendor_activities_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_claim_invites" ADD CONSTRAINT "vendor_claim_invites_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_claim_invites" ADD CONSTRAINT "vendor_claim_invites_invitedByAdminId_fkey" FOREIGN KEY ("invitedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_quote_requests" ADD CONSTRAINT "vendor_quote_requests_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profile_change_requests" ADD CONSTRAINT "vendor_profile_change_requests_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profile_change_requests" ADD CONSTRAINT "vendor_profile_change_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profile_change_requests" ADD CONSTRAINT "vendor_profile_change_requests_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "admin_permission_overrides_accessProfileId_permissionId_effect_" RENAME TO "admin_permission_overrides_accessProfileId_permissionId_eff_key";

-- RenameIndex
ALTER INDEX "price_check_payment_line_items_paymentOrderId_fulfilmentStatus_" RENAME TO "price_check_payment_line_items_paymentOrderId_fulfilmentSta_idx";
