-- DropIndex
DROP INDEX "cms_articles_audience_isPublished_publishedAt_idx";

-- CreateTable
CREATE TABLE "price_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_product_families" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "funnelRole" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "normalizedUnitCode" TEXT NOT NULL,
    "normalizedUnitRationale" TEXT NOT NULL,
    "sellerUnitCodes" JSONB NOT NULL,
    "applicableConditions" JSONB NOT NULL,
    "definition" JSONB NOT NULL,
    "definitionSchemaVersion" INTEGER NOT NULL DEFAULT 1,
    "escalationPrimary" TEXT NOT NULL,
    "escalationSecondary" TEXT,
    "escalationReason" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_product_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_products" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT,
    "specification" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_aliases" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "productId" TEXT,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'stage2_taxonomy',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_specification_definitions" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceChanging" BOOLEAN NOT NULL,
    "allowedValues" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_specification_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "aliases" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_conversion_rules" (
    "id" TEXT NOT NULL,
    "fromUnitCode" TEXT NOT NULL,
    "toUnitCode" TEXT NOT NULL,
    "factorSource" TEXT NOT NULL,
    "fixedFactor" DECIMAL(18,6),
    "requiredInput" TEXT NOT NULL,
    "note" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_conversion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_service_families" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricingBasis" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "escalationPrimary" TEXT NOT NULL,
    "escalationSecondary" TEXT,
    "escalationReason" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_service_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "launchPriority" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_sources" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "accessStatus" TEXT NOT NULL,
    "accessNote" TEXT,
    "baseUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_sellers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "sourceId" TEXT,
    "locationId" TEXT,
    "vendorUserId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactNote" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_observations" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "productId" TEXT,
    "sourceId" TEXT NOT NULL,
    "sellerId" TEXT,
    "sellerLocationId" TEXT,
    "deliveryLocationId" TEXT,
    "sourceMarketLocationId" TEXT,
    "originalWording" TEXT NOT NULL,
    "originalPrice" DECIMAL(14,2) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'NGN',
    "originalQuantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "originalUnitCode" TEXT NOT NULL,
    "normalizedPrice" DECIMAL(14,4),
    "normalizedUnitCode" TEXT,
    "conversionRuleId" TEXT,
    "conversionInputs" JSONB,
    "conversionFactorSource" TEXT,
    "conversionConfidence" DOUBLE PRECISION,
    "condition" TEXT NOT NULL DEFAULT 'new',
    "availabilityState" TEXT NOT NULL DEFAULT 'unknown',
    "deliveryIncluded" TEXT NOT NULL DEFAULT 'unknown',
    "installationIncluded" TEXT NOT NULL DEFAULT 'unknown',
    "vatIncluded" TEXT NOT NULL DEFAULT 'unknown',
    "accessoriesIncluded" TEXT NOT NULL DEFAULT 'unknown',
    "warrantyIncluded" TEXT NOT NULL DEFAULT 'unknown',
    "listingDate" TIMESTAMP(3),
    "checkedDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "collectionMethod" TEXT NOT NULL,
    "evidenceClass" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskFlags" JSONB,
    "evidenceDocumentId" TEXT,
    "materialId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "duplicateFingerprint" TEXT NOT NULL,
    "supersededByObservationId" TEXT,
    "rejectionReason" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_observation_attributes" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_observation_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_evidence_documents" (
    "id" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "researchRequestId" TEXT,
    "kind" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'uploaded',
    "privateFileRef" TEXT NOT NULL,
    "redactedFileRef" TEXT,
    "extractedData" JSONB,
    "redactedExtract" JSONB,
    "sensitive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_evidence_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rawQuery" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "matchedFamilyId" TEXT,
    "matchType" TEXT,
    "locationId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'search',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_research_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "requestedLocationId" TEXT,
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_research_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_research_request_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "familyId" TEXT,
    "customProductRequestId" TEXT,
    "rawProductName" TEXT NOT NULL,
    "specification" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "countsTowardAllowance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_research_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_research_runs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestItemId" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'running',
    "engineVersion" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorSummary" TEXT,
    "costTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_research_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_research_clarifications" (
    "id" TEXT NOT NULL,
    "requestItemId" TEXT NOT NULL,
    "questionJson" JSONB NOT NULL,
    "answerJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'asked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_research_clarifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_reports" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_report_items" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "requestItemId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "rangeLow" DECIMAL(14,2),
    "rangeHigh" DECIMAL(14,2),
    "medianPrice" DECIMAL(14,2),
    "typicalPrice" DECIMAL(14,2),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'NGN',
    "unitCode" TEXT,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locationMatchLevel" TEXT,
    "fallbackLevel" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_credit_ledger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "requestId" TEXT,
    "reportId" TEXT,
    "paymentReference" TEXT,
    "reason" TEXT NOT NULL,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_temporary_matrices" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestItemId" TEXT NOT NULL,
    "matchedFamilyId" TEXT,
    "rawInput" TEXT NOT NULL,
    "matrixJson" JSONB NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelResponseId" TEXT,
    "promptVersion" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "inputHash" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL,
    "validationErrors" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "uncertaintyReasons" JSONB,
    "readinessState" TEXT NOT NULL,
    "escalationRecommended" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "supersededByMatrixId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_temporary_matrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_custom_product_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rawQuery" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "matchedFamilyId" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'private_candidate',
    "approvalStatus" TEXT NOT NULL DEFAULT 'none',
    "aiSuggestion" JSONB,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "paidIntentCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_custom_product_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_taxonomy_change_requests" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "customProductRequestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "approvedByAdminId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "auditLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_taxonomy_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_terminology_checks" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelResponseId" TEXT,
    "sourceReference" TEXT NOT NULL,
    "dateChecked" TIMESTAMP(3) NOT NULL,
    "findings" JSONB NOT NULL,
    "validationResult" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "adminCorrectionApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_terminology_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_professional_reviews" (
    "id" TEXT NOT NULL,
    "familyKey" TEXT NOT NULL,
    "familyVersion" INTEGER NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerProfession" TEXT NOT NULL,
    "relevantQualification" TEXT NOT NULL,
    "reviewScope" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "evidenceAttachmentRef" TEXT,
    "adminApproverId" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_professional_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_seed_meta" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_seed_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_categories_code_key" ON "price_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "price_product_families_key_key" ON "price_product_families"("key");

-- CreateIndex
CREATE INDEX "price_product_families_categoryId_idx" ON "price_product_families"("categoryId");

-- CreateIndex
CREATE INDEX "price_product_families_funnelRole_idx" ON "price_product_families"("funnelRole");

-- CreateIndex
CREATE INDEX "price_products_brandId_idx" ON "price_products"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "price_products_familyId_key_key" ON "price_products"("familyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "price_brands_normalizedName_key" ON "price_brands"("normalizedName");

-- CreateIndex
CREATE INDEX "price_aliases_normalizedAlias_idx" ON "price_aliases"("normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "price_aliases_familyId_normalizedAlias_key" ON "price_aliases"("familyId", "normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "price_specification_definitions_familyId_key_key" ON "price_specification_definitions"("familyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "price_units_code_key" ON "price_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "price_conversion_rules_fromUnitCode_toUnitCode_factorSource_key" ON "price_conversion_rules"("fromUnitCode", "toUnitCode", "factorSource");

-- CreateIndex
CREATE UNIQUE INDEX "price_service_families_key_key" ON "price_service_families"("key");

-- CreateIndex
CREATE UNIQUE INDEX "price_locations_code_key" ON "price_locations"("code");

-- CreateIndex
CREATE INDEX "price_locations_parentId_idx" ON "price_locations"("parentId");

-- CreateIndex
CREATE INDEX "price_locations_type_idx" ON "price_locations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "price_sources_code_key" ON "price_sources"("code");

-- CreateIndex
CREATE INDEX "price_sources_tier_idx" ON "price_sources"("tier");

-- CreateIndex
CREATE INDEX "price_sellers_sourceId_idx" ON "price_sellers"("sourceId");

-- CreateIndex
CREATE INDEX "price_sellers_locationId_idx" ON "price_sellers"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "price_sellers_normalizedName_sourceId_key" ON "price_sellers"("normalizedName", "sourceId");

-- CreateIndex
CREATE INDEX "price_observations_familyId_status_checkedDate_idx" ON "price_observations"("familyId", "status", "checkedDate");

-- CreateIndex
CREATE INDEX "price_observations_duplicateFingerprint_idx" ON "price_observations"("duplicateFingerprint");

-- CreateIndex
CREATE INDEX "price_observations_sellerId_idx" ON "price_observations"("sellerId");

-- CreateIndex
CREATE INDEX "price_observations_sourceId_idx" ON "price_observations"("sourceId");

-- CreateIndex
CREATE INDEX "price_observations_checkedDate_idx" ON "price_observations"("checkedDate");

-- CreateIndex
CREATE INDEX "price_observations_status_idx" ON "price_observations"("status");

-- CreateIndex
CREATE INDEX "price_observation_attributes_key_value_idx" ON "price_observation_attributes"("key", "value");

-- CreateIndex
CREATE UNIQUE INDEX "price_observation_attributes_observationId_key_key" ON "price_observation_attributes"("observationId", "key");

-- CreateIndex
CREATE INDEX "price_evidence_documents_uploadedByUserId_idx" ON "price_evidence_documents"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "price_evidence_documents_researchRequestId_idx" ON "price_evidence_documents"("researchRequestId");

-- CreateIndex
CREATE INDEX "price_queries_userId_createdAt_idx" ON "price_queries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "price_queries_normalizedQuery_idx" ON "price_queries"("normalizedQuery");

-- CreateIndex
CREATE INDEX "price_research_requests_userId_status_idx" ON "price_research_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "price_research_requests_userId_createdAt_idx" ON "price_research_requests"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "price_research_request_items_requestId_idx" ON "price_research_request_items"("requestId");

-- CreateIndex
CREATE INDEX "price_research_request_items_status_idx" ON "price_research_request_items"("status");

-- CreateIndex
CREATE INDEX "price_research_runs_requestId_idx" ON "price_research_runs"("requestId");

-- CreateIndex
CREATE INDEX "price_research_runs_requestItemId_idx" ON "price_research_runs"("requestItemId");

-- CreateIndex
CREATE INDEX "price_research_clarifications_requestItemId_idx" ON "price_research_clarifications"("requestItemId");

-- CreateIndex
CREATE UNIQUE INDEX "price_reports_requestId_key" ON "price_reports"("requestId");

-- CreateIndex
CREATE INDEX "price_reports_userId_createdAt_idx" ON "price_reports"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "price_report_items_requestItemId_key" ON "price_report_items"("requestItemId");

-- CreateIndex
CREATE INDEX "price_report_items_reportId_idx" ON "price_report_items"("reportId");

-- CreateIndex
CREATE INDEX "price_credit_ledger_userId_createdAt_idx" ON "price_credit_ledger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "price_credit_ledger_requestId_idx" ON "price_credit_ledger"("requestId");

-- CreateIndex
CREATE INDEX "price_temporary_matrices_requestItemId_idx" ON "price_temporary_matrices"("requestItemId");

-- CreateIndex
CREATE INDEX "price_temporary_matrices_inputHash_idx" ON "price_temporary_matrices"("inputHash");

-- CreateIndex
CREATE INDEX "price_custom_product_requests_approvalStatus_idx" ON "price_custom_product_requests"("approvalStatus");

-- CreateIndex
CREATE INDEX "price_custom_product_requests_normalizedQuery_idx" ON "price_custom_product_requests"("normalizedQuery");

-- CreateIndex
CREATE INDEX "price_taxonomy_change_requests_status_idx" ON "price_taxonomy_change_requests"("status");

-- CreateIndex
CREATE INDEX "price_terminology_checks_familyId_idx" ON "price_terminology_checks"("familyId");

-- CreateIndex
CREATE INDEX "price_professional_reviews_familyKey_familyVersion_idx" ON "price_professional_reviews"("familyKey", "familyVersion");

-- CreateIndex
CREATE UNIQUE INDEX "price_seed_meta_key_key" ON "price_seed_meta"("key");

-- AddForeignKey
ALTER TABLE "price_product_families" ADD CONSTRAINT "price_product_families_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "price_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_product_families" ADD CONSTRAINT "price_product_families_normalizedUnitCode_fkey" FOREIGN KEY ("normalizedUnitCode") REFERENCES "price_units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_products" ADD CONSTRAINT "price_products_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "price_product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_products" ADD CONSTRAINT "price_products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "price_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_aliases" ADD CONSTRAINT "price_aliases_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "price_product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_aliases" ADD CONSTRAINT "price_aliases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "price_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_specification_definitions" ADD CONSTRAINT "price_specification_definitions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "price_product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_conversion_rules" ADD CONSTRAINT "price_conversion_rules_fromUnitCode_fkey" FOREIGN KEY ("fromUnitCode") REFERENCES "price_units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_conversion_rules" ADD CONSTRAINT "price_conversion_rules_toUnitCode_fkey" FOREIGN KEY ("toUnitCode") REFERENCES "price_units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_locations" ADD CONSTRAINT "price_locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_sellers" ADD CONSTRAINT "price_sellers_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "price_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_sellers" ADD CONSTRAINT "price_sellers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "price_product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "price_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "price_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "price_sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_sellerLocationId_fkey" FOREIGN KEY ("sellerLocationId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_deliveryLocationId_fkey" FOREIGN KEY ("deliveryLocationId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_sourceMarketLocationId_fkey" FOREIGN KEY ("sourceMarketLocationId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_originalUnitCode_fkey" FOREIGN KEY ("originalUnitCode") REFERENCES "price_units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_normalizedUnitCode_fkey" FOREIGN KEY ("normalizedUnitCode") REFERENCES "price_units"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_conversionRuleId_fkey" FOREIGN KEY ("conversionRuleId") REFERENCES "price_conversion_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "price_evidence_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_supersededByObservationId_fkey" FOREIGN KEY ("supersededByObservationId") REFERENCES "price_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_observation_attributes" ADD CONSTRAINT "price_observation_attributes_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "price_observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_evidence_documents" ADD CONSTRAINT "price_evidence_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_evidence_documents" ADD CONSTRAINT "price_evidence_documents_researchRequestId_fkey" FOREIGN KEY ("researchRequestId") REFERENCES "price_research_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_queries" ADD CONSTRAINT "price_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_queries" ADD CONSTRAINT "price_queries_matchedFamilyId_fkey" FOREIGN KEY ("matchedFamilyId") REFERENCES "price_product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_queries" ADD CONSTRAINT "price_queries_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_requests" ADD CONSTRAINT "price_research_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_requests" ADD CONSTRAINT "price_research_requests_requestedLocationId_fkey" FOREIGN KEY ("requestedLocationId") REFERENCES "price_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_request_items" ADD CONSTRAINT "price_research_request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "price_research_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_request_items" ADD CONSTRAINT "price_research_request_items_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "price_product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_request_items" ADD CONSTRAINT "price_research_request_items_customProductRequestId_fkey" FOREIGN KEY ("customProductRequestId") REFERENCES "price_custom_product_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_runs" ADD CONSTRAINT "price_research_runs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "price_research_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_runs" ADD CONSTRAINT "price_research_runs_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "price_research_request_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_research_clarifications" ADD CONSTRAINT "price_research_clarifications_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "price_research_request_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "price_research_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_report_items" ADD CONSTRAINT "price_report_items_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "price_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_report_items" ADD CONSTRAINT "price_report_items_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "price_research_request_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_credit_ledger" ADD CONSTRAINT "price_credit_ledger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_credit_ledger" ADD CONSTRAINT "price_credit_ledger_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "price_research_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_temporary_matrices" ADD CONSTRAINT "price_temporary_matrices_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "price_research_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_temporary_matrices" ADD CONSTRAINT "price_temporary_matrices_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "price_research_request_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_temporary_matrices" ADD CONSTRAINT "price_temporary_matrices_matchedFamilyId_fkey" FOREIGN KEY ("matchedFamilyId") REFERENCES "price_product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_temporary_matrices" ADD CONSTRAINT "price_temporary_matrices_supersededByMatrixId_fkey" FOREIGN KEY ("supersededByMatrixId") REFERENCES "price_temporary_matrices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_custom_product_requests" ADD CONSTRAINT "price_custom_product_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_taxonomy_change_requests" ADD CONSTRAINT "price_taxonomy_change_requests_approvedByAdminId_fkey" FOREIGN KEY ("approvedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_taxonomy_change_requests" ADD CONSTRAINT "price_taxonomy_change_requests_customProductRequestId_fkey" FOREIGN KEY ("customProductRequestId") REFERENCES "price_custom_product_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_terminology_checks" ADD CONSTRAINT "price_terminology_checks_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "price_product_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_professional_reviews" ADD CONSTRAINT "price_professional_reviews_adminApproverId_fkey" FOREIGN KEY ("adminApproverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
