-- Stage 8 — Price Intelligence operations (admin review cockpit).
-- Additive only. Corrections never overwrite original observations.

-- User PI sub-permissions (empty = all permissions for admins)
ALTER TABLE "users" ADD COLUMN "priceIntelligencePermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- PriceSource health fields
ALTER TABLE "price_sources" ADD COLUMN "healthStatus" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "price_sources" ADD COLUMN "lastSuccessAt" TIMESTAMP(3);
ALTER TABLE "price_sources" ADD COLUMN "lastFailureAt" TIMESTAMP(3);
ALTER TABLE "price_sources" ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "price_sources" ADD COLUMN "successRate" DOUBLE PRECISION;
ALTER TABLE "price_sources" ADD COLUMN "parseSuccessRate" DOUBLE PRECISION;
ALTER TABLE "price_sources" ADD COLUMN "avgLatencyMs" INTEGER;
ALTER TABLE "price_sources" ADD COLUMN "disabledAt" TIMESTAMP(3);
ALTER TABLE "price_sources" ADD COLUMN "disabledByAdminId" TEXT;
ALTER TABLE "price_sources" ADD COLUMN "disabledReason" TEXT;
ALTER TABLE "price_sources" ADD COLUMN "healthNote" TEXT;
ALTER TABLE "price_sources" ADD COLUMN "lastCheckedAt" TIMESTAMP(3);

CREATE INDEX "price_sources_healthStatus_idx" ON "price_sources"("healthStatus");

ALTER TABLE "price_sources"
  ADD CONSTRAINT "price_sources_disabledByAdminId_fkey"
  FOREIGN KEY ("disabledByAdminId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- PriceReport revision fields
ALTER TABLE "price_reports" ADD COLUMN "customerUpdateNotice" TEXT;
ALTER TABLE "price_reports" ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "price_report_items_outcome_idx" ON "price_report_items"("outcome");

-- Report revisions
CREATE TABLE "price_report_revisions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "itemsSnapshot" JSONB NOT NULL,
    "customerNotice" TEXT,
    "materialChange" BOOLEAN NOT NULL DEFAULT false,
    "createdByAdminId" TEXT,
    "reviewCaseId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_report_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_report_revisions_reportId_version_key"
  ON "price_report_revisions"("reportId", "version");
CREATE INDEX "price_report_revisions_reportId_createdAt_idx"
  ON "price_report_revisions"("reportId", "createdAt");

-- Merchants (created before submissions / review cases that reference them)
CREATE TABLE "price_merchants" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "tradingName" TEXT,
    "sellerType" TEXT NOT NULL DEFAULT 'retailer',
    "city" TEXT,
    "state" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "sourceTier" INTEGER NOT NULL DEFAULT 3,
    "riskNotes" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_merchants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_merchants_verificationStatus_idx" ON "price_merchants"("verificationStatus");
CREATE INDEX "price_merchants_state_city_idx" ON "price_merchants"("state", "city");

-- Manual price entries
CREATE TABLE "manual_price_entries" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "evidenceFileRef" TEXT,
    "evidenceDocumentId" TEXT,
    "locationKey" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_price_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_price_entries_status_createdAt_idx"
  ON "manual_price_entries"("status", "createdAt");
CREATE INDEX "manual_price_entries_createdByAdminId_idx"
  ON "manual_price_entries"("createdByAdminId");

CREATE TABLE "manual_price_entry_items" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "familyKey" TEXT,
    "productLabel" TEXT NOT NULL,
    "brandName" TEXT,
    "originalWording" TEXT NOT NULL,
    "originalPrice" DECIMAL(14,2) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'NGN',
    "originalUnitCode" TEXT NOT NULL,
    "locationKey" TEXT,
    "specification" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "observationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_price_entry_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_price_entry_items_entryId_status_idx"
  ON "manual_price_entry_items"("entryId", "status");

-- Merchant submissions
CREATE TABLE "merchant_price_submissions" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "evidenceFileRef" TEXT,
    "evidenceDocumentId" TEXT,
    "createdByAdminId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_price_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "merchant_price_submissions_status_createdAt_idx"
  ON "merchant_price_submissions"("status", "createdAt");
CREATE INDEX "merchant_price_submissions_merchantId_idx"
  ON "merchant_price_submissions"("merchantId");

CREATE TABLE "merchant_price_submission_items" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "familyKey" TEXT,
    "productLabel" TEXT NOT NULL,
    "brandName" TEXT,
    "originalWording" TEXT NOT NULL,
    "originalPrice" DECIMAL(14,2) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'NGN',
    "originalUnitCode" TEXT NOT NULL,
    "locationKey" TEXT,
    "specification" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "observationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_price_submission_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "merchant_price_submission_items_submissionId_status_idx"
  ON "merchant_price_submission_items"("submissionId", "status");

-- Review cases
CREATE TABLE "price_review_cases" (
    "id" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL,
    "priorityReason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "triggerCode" TEXT NOT NULL,
    "triggerDetails" JSONB,
    "productFamilyKey" TEXT,
    "productLabel" TEXT,
    "locationKey" TEXT,
    "confidenceLabel" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "reportId" TEXT,
    "reportItemId" TEXT,
    "observationId" TEXT,
    "sourceId" TEXT,
    "merchantSubmissionId" TEXT,
    "manualEntryItemId" TEXT,
    "customerImpactCount" INTEGER NOT NULL DEFAULT 1,
    "paidCustomerImpactCount" INTEGER NOT NULL DEFAULT 0,
    "assignedReviewerId" TEXT,
    "dueAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdByType" TEXT NOT NULL DEFAULT 'system',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_review_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_review_cases_status_priorityScore_idx"
  ON "price_review_cases"("status", "priorityScore");
CREATE INDEX "price_review_cases_status_dueAt_idx"
  ON "price_review_cases"("status", "dueAt");
CREATE INDEX "price_review_cases_assignedReviewerId_status_idx"
  ON "price_review_cases"("assignedReviewerId", "status");
CREATE INDEX "price_review_cases_caseType_status_idx"
  ON "price_review_cases"("caseType", "status");
CREATE INDEX "price_review_cases_reportId_idx" ON "price_review_cases"("reportId");
CREATE INDEX "price_review_cases_productFamilyKey_idx" ON "price_review_cases"("productFamilyKey");
CREATE INDEX "price_review_cases_openedAt_idx" ON "price_review_cases"("openedAt");

CREATE TABLE "price_review_case_events" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "actorAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_review_case_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_review_case_events_caseId_createdAt_idx"
  ON "price_review_case_events"("caseId", "createdAt");

CREATE TABLE "price_observation_corrections" (
    "id" TEXT NOT NULL,
    "originalObservationId" TEXT NOT NULL,
    "correctedObservationId" TEXT NOT NULL,
    "correctionType" TEXT NOT NULL,
    "changedFields" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewCaseId" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_observation_corrections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_observation_corrections_originalObservationId_idx"
  ON "price_observation_corrections"("originalObservationId");
CREATE INDEX "price_observation_corrections_reviewCaseId_idx"
  ON "price_observation_corrections"("reviewCaseId");

CREATE TABLE "source_health_snapshots" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "successRate" DOUBLE PRECISION,
    "parseSuccessRate" DOUBLE PRECISION,
    "avgLatencyMs" INTEGER,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "checkType" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "checkedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_health_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "source_health_snapshots_sourceId_createdAt_idx"
  ON "source_health_snapshots"("sourceId", "createdAt");

CREATE TABLE "price_intelligence_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actorAdminId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_intelligence_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_intelligence_audit_log_entityType_entityId_createdAt_idx"
  ON "price_intelligence_audit_log"("entityType", "entityId", "createdAt");
CREATE INDEX "price_intelligence_audit_log_actorAdminId_createdAt_idx"
  ON "price_intelligence_audit_log"("actorAdminId", "createdAt");
CREATE INDEX "price_intelligence_audit_log_action_createdAt_idx"
  ON "price_intelligence_audit_log"("action", "createdAt");

CREATE TABLE "price_intelligence_reviewers" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categoryScope" JSONB,
    "availabilityNotes" TEXT,
    "maximumOpenCases" INTEGER NOT NULL DEFAULT 25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_intelligence_reviewers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_intelligence_reviewers_adminUserId_key"
  ON "price_intelligence_reviewers"("adminUserId");
CREATE INDEX "price_intelligence_reviewers_active_idx"
  ON "price_intelligence_reviewers"("active");

CREATE TABLE "price_intelligence_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_intelligence_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_intelligence_settings_key_key"
  ON "price_intelligence_settings"("key");

CREATE TABLE "price_unmatched_terms" (
    "id" TEXT NOT NULL,
    "normalizedTerm" TEXT NOT NULL,
    "sampleRawQuery" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "paidIntentCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suggestedFamilyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_unmatched_terms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_unmatched_terms_normalizedTerm_key"
  ON "price_unmatched_terms"("normalizedTerm");
CREATE INDEX "price_unmatched_terms_status_requestCount_idx"
  ON "price_unmatched_terms"("status", "requestCount");
CREATE INDEX "price_unmatched_terms_lastSeenAt_idx"
  ON "price_unmatched_terms"("lastSeenAt");

-- Foreign keys (after all tables exist)
ALTER TABLE "price_report_revisions"
  ADD CONSTRAINT "price_report_revisions_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "price_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_report_revisions"
  ADD CONSTRAINT "price_report_revisions_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_report_revisions"
  ADD CONSTRAINT "price_report_revisions_reviewCaseId_fkey"
  FOREIGN KEY ("reviewCaseId") REFERENCES "price_review_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manual_price_entries"
  ADD CONSTRAINT "manual_price_entries_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manual_price_entries"
  ADD CONSTRAINT "manual_price_entries_reviewedByAdminId_fkey"
  FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "manual_price_entries"
  ADD CONSTRAINT "manual_price_entries_evidenceDocumentId_fkey"
  FOREIGN KEY ("evidenceDocumentId") REFERENCES "price_evidence_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manual_price_entry_items"
  ADD CONSTRAINT "manual_price_entry_items_entryId_fkey"
  FOREIGN KEY ("entryId") REFERENCES "manual_price_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "merchant_price_submissions"
  ADD CONSTRAINT "merchant_price_submissions_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "price_merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchant_price_submissions"
  ADD CONSTRAINT "merchant_price_submissions_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "merchant_price_submissions"
  ADD CONSTRAINT "merchant_price_submissions_evidenceDocumentId_fkey"
  FOREIGN KEY ("evidenceDocumentId") REFERENCES "price_evidence_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "merchant_price_submission_items"
  ADD CONSTRAINT "merchant_price_submission_items_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "merchant_price_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "merchant_price_submission_items"
  ADD CONSTRAINT "merchant_price_submission_items_reviewedByAdminId_fkey"
  FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "price_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_reportItemId_fkey"
  FOREIGN KEY ("reportItemId") REFERENCES "price_report_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_observationId_fkey"
  FOREIGN KEY ("observationId") REFERENCES "price_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "price_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_merchantSubmissionId_fkey"
  FOREIGN KEY ("merchantSubmissionId") REFERENCES "merchant_price_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_manualEntryItemId_fkey"
  FOREIGN KEY ("manualEntryItemId") REFERENCES "manual_price_entry_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_review_cases"
  ADD CONSTRAINT "price_review_cases_assignedReviewerId_fkey"
  FOREIGN KEY ("assignedReviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "price_review_case_events"
  ADD CONSTRAINT "price_review_case_events_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "price_review_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_review_case_events"
  ADD CONSTRAINT "price_review_case_events_actorAdminId_fkey"
  FOREIGN KEY ("actorAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "price_observation_corrections"
  ADD CONSTRAINT "price_observation_corrections_originalObservationId_fkey"
  FOREIGN KEY ("originalObservationId") REFERENCES "price_observations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "price_observation_corrections"
  ADD CONSTRAINT "price_observation_corrections_correctedObservationId_fkey"
  FOREIGN KEY ("correctedObservationId") REFERENCES "price_observations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "price_observation_corrections"
  ADD CONSTRAINT "price_observation_corrections_reviewCaseId_fkey"
  FOREIGN KEY ("reviewCaseId") REFERENCES "price_review_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_observation_corrections"
  ADD CONSTRAINT "price_observation_corrections_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "source_health_snapshots"
  ADD CONSTRAINT "source_health_snapshots_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "price_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_intelligence_audit_log"
  ADD CONSTRAINT "price_intelligence_audit_log_actorAdminId_fkey"
  FOREIGN KEY ("actorAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "price_intelligence_reviewers"
  ADD CONSTRAINT "price_intelligence_reviewers_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
