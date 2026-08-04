-- People & HR module

CREATE TABLE "hr_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headUserId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_positions" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportsToPositionId" TEXT,
    "allowedWorkforceTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kpiDefinitions" JSONB,
    "compensationMin" DECIMAL(14,2),
    "compensationMax" DECIMAL(14,2),
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'NGN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_candidates" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "departmentId" TEXT,
    "positionId" TEXT,
    "cvUrl" TEXT,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "hiringManagerUserId" TEXT,
    "interviewDate" TIMESTAMP(3),
    "interviewNotes" TEXT,
    "interviewScore" DOUBLE PRECISION,
    "assessmentInstructions" TEXT,
    "assessmentSubmission" TEXT,
    "assessmentScore" DOUBLE PRECISION,
    "pilotNotes" TEXT,
    "referencesJson" JSONB,
    "referenceCheckNotes" TEXT,
    "offerDetails" TEXT,
    "rejectionReason" TEXT,
    "internalNotes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "candidateId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "pictureUrl" TEXT,
    "address" TEXT,
    "location" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "workforceType" TEXT NOT NULL,
    "departmentId" TEXT,
    "positionId" TEXT,
    "managerUserId" TEXT,
    "workLocation" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "probationEndDate" TIMESTAMP(3),
    "employmentStatus" TEXT NOT NULL DEFAULT 'onboarding',
    "baseCompensation" DECIMAL(14,2),
    "transportAllowance" DECIMAL(14,2),
    "communicationAllowance" DECIMAL(14,2),
    "otherAllowances" DECIMAL(14,2),
    "bonusNotes" TEXT,
    "paymentFrequency" TEXT,
    "currencyCode" CHAR(3) NOT NULL DEFAULT 'NGN',
    "exitDate" TIMESTAMP(3),
    "exitReason" TEXT,
    "finalHandoverNotes" TEXT,
    "companyPropertyReturned" BOOLEAN NOT NULL DEFAULT false,
    "accountDisabledAt" TIMESTAMP(3),
    "permissionsRevokedAt" TIMESTAMP(3),
    "documentsArchivedAt" TIMESTAMP(3),
    "exitNotes" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_staff_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_candidate_stage_events" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "note" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_candidate_stage_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_admin_permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_admin_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_admin_roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_admin_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_admin_role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "hr_admin_role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_staff_role_assignments" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_staff_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_documents" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "staffProfileId" TEXT,
    "candidateId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedByUserId" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "signatureStatus" TEXT NOT NULL DEFAULT 'unsigned',
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_onboarding_tasks" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_onboarding_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_staff_performance_goals" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "actualResult" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "managerComments" TEXT,
    "reviewType" TEXT NOT NULL DEFAULT 'monthly',
    "bonusEligibleNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_staff_performance_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_performance_reviews" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "period" TEXT,
    "summary" TEXT,
    "rating" TEXT,
    "managerComments" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_performance_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_communications" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "staffProfileId" TEXT,
    "candidateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sentByUserId" TEXT,
    "providerId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_communications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_policies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effectiveDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "appliesCompanyWide" BOOLEAN NOT NULL DEFAULT true,
    "departmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "positionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_policy_acknowledgements" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_policy_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_audit_log_pkey" PRIMARY KEY ("id")
);

-- Uniques & indexes
CREATE UNIQUE INDEX "hr_departments_name_key" ON "hr_departments"("name");
CREATE INDEX "hr_departments_archivedAt_idx" ON "hr_departments"("archivedAt");

CREATE UNIQUE INDEX "hr_positions_departmentId_name_key" ON "hr_positions"("departmentId", "name");
CREATE INDEX "hr_positions_departmentId_active_idx" ON "hr_positions"("departmentId", "active");

CREATE UNIQUE INDEX "hr_staff_profiles_userId_key" ON "hr_staff_profiles"("userId");
CREATE UNIQUE INDEX "hr_staff_profiles_candidateId_key" ON "hr_staff_profiles"("candidateId");
CREATE INDEX "hr_staff_profiles_employmentStatus_idx" ON "hr_staff_profiles"("employmentStatus");
CREATE INDEX "hr_staff_profiles_departmentId_idx" ON "hr_staff_profiles"("departmentId");
CREATE INDEX "hr_staff_profiles_workforceType_idx" ON "hr_staff_profiles"("workforceType");
CREATE INDEX "hr_staff_profiles_email_idx" ON "hr_staff_profiles"("email");

CREATE INDEX "hr_candidates_stage_idx" ON "hr_candidates"("stage");
CREATE INDEX "hr_candidates_departmentId_positionId_idx" ON "hr_candidates"("departmentId", "positionId");
CREATE INDEX "hr_candidates_email_idx" ON "hr_candidates"("email");

CREATE INDEX "hr_candidate_stage_events_candidateId_createdAt_idx" ON "hr_candidate_stage_events"("candidateId", "createdAt");

CREATE UNIQUE INDEX "hr_admin_permissions_key_key" ON "hr_admin_permissions"("key");
CREATE INDEX "hr_admin_permissions_groupLabel_idx" ON "hr_admin_permissions"("groupLabel");

CREATE UNIQUE INDEX "hr_admin_roles_key_key" ON "hr_admin_roles"("key");

CREATE UNIQUE INDEX "hr_admin_role_permissions_roleId_permissionId_key" ON "hr_admin_role_permissions"("roleId", "permissionId");

CREATE INDEX "hr_staff_role_assignments_staffProfileId_revokedAt_idx" ON "hr_staff_role_assignments"("staffProfileId", "revokedAt");
CREATE INDEX "hr_staff_role_assignments_roleId_idx" ON "hr_staff_role_assignments"("roleId");

CREATE INDEX "hr_documents_staffProfileId_idx" ON "hr_documents"("staffProfileId");
CREATE INDEX "hr_documents_candidateId_idx" ON "hr_documents"("candidateId");
CREATE INDEX "hr_documents_expiryDate_idx" ON "hr_documents"("expiryDate");
CREATE INDEX "hr_documents_category_idx" ON "hr_documents"("category");

CREATE UNIQUE INDEX "hr_onboarding_tasks_staffProfileId_key_key" ON "hr_onboarding_tasks"("staffProfileId", "key");
CREATE INDEX "hr_onboarding_tasks_staffProfileId_status_idx" ON "hr_onboarding_tasks"("staffProfileId", "status");

CREATE INDEX "hr_staff_performance_goals_staffProfileId_period_idx" ON "hr_staff_performance_goals"("staffProfileId", "period");
CREATE INDEX "hr_performance_reviews_staffProfileId_reviewedAt_idx" ON "hr_performance_reviews"("staffProfileId", "reviewedAt");

CREATE INDEX "hr_communications_candidateId_createdAt_idx" ON "hr_communications"("candidateId", "createdAt");
CREATE INDEX "hr_communications_staffProfileId_createdAt_idx" ON "hr_communications"("staffProfileId", "createdAt");
CREATE INDEX "hr_communications_status_createdAt_idx" ON "hr_communications"("status", "createdAt");

CREATE INDEX "hr_policies_status_category_idx" ON "hr_policies"("status", "category");

CREATE UNIQUE INDEX "hr_policy_acknowledgements_policyId_staffProfileId_version_key" ON "hr_policy_acknowledgements"("policyId", "staffProfileId", "version");
CREATE INDEX "hr_policy_acknowledgements_policyId_idx" ON "hr_policy_acknowledgements"("policyId");

CREATE INDEX "hr_audit_log_entityType_entityId_createdAt_idx" ON "hr_audit_log"("entityType", "entityId", "createdAt");
CREATE INDEX "hr_audit_log_actorUserId_createdAt_idx" ON "hr_audit_log"("actorUserId", "createdAt");
CREATE INDEX "hr_audit_log_action_createdAt_idx" ON "hr_audit_log"("action", "createdAt");

-- Foreign keys
ALTER TABLE "hr_departments" ADD CONSTRAINT "hr_departments_headUserId_fkey" FOREIGN KEY ("headUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_positions" ADD CONSTRAINT "hr_positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hr_positions" ADD CONSTRAINT "hr_positions_reportsToPositionId_fkey" FOREIGN KEY ("reportsToPositionId") REFERENCES "hr_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_candidates" ADD CONSTRAINT "hr_candidates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_candidates" ADD CONSTRAINT "hr_candidates_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "hr_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_candidates" ADD CONSTRAINT "hr_candidates_hiringManagerUserId_fkey" FOREIGN KEY ("hiringManagerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_staff_profiles" ADD CONSTRAINT "hr_staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_staff_profiles" ADD CONSTRAINT "hr_staff_profiles_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "hr_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_staff_profiles" ADD CONSTRAINT "hr_staff_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "hr_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_staff_profiles" ADD CONSTRAINT "hr_staff_profiles_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "hr_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_staff_profiles" ADD CONSTRAINT "hr_staff_profiles_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_candidate_stage_events" ADD CONSTRAINT "hr_candidate_stage_events_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "hr_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_admin_role_permissions" ADD CONSTRAINT "hr_admin_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "hr_admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_admin_role_permissions" ADD CONSTRAINT "hr_admin_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "hr_admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_staff_role_assignments" ADD CONSTRAINT "hr_staff_role_assignments_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_staff_role_assignments" ADD CONSTRAINT "hr_staff_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "hr_admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_staff_role_assignments" ADD CONSTRAINT "hr_staff_role_assignments_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_documents" ADD CONSTRAINT "hr_documents_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_documents" ADD CONSTRAINT "hr_documents_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "hr_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_documents" ADD CONSTRAINT "hr_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_onboarding_tasks" ADD CONSTRAINT "hr_onboarding_tasks_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_onboarding_tasks" ADD CONSTRAINT "hr_onboarding_tasks_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_staff_performance_goals" ADD CONSTRAINT "hr_staff_performance_goals_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_performance_reviews" ADD CONSTRAINT "hr_performance_reviews_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_communications" ADD CONSTRAINT "hr_communications_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_communications" ADD CONSTRAINT "hr_communications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "hr_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_communications" ADD CONSTRAINT "hr_communications_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_policies" ADD CONSTRAINT "hr_policies_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_policies" ADD CONSTRAINT "hr_policies_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_policy_acknowledgements" ADD CONSTRAINT "hr_policy_acknowledgements_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "hr_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_policy_acknowledgements" ADD CONSTRAINT "hr_policy_acknowledgements_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_audit_log" ADD CONSTRAINT "hr_audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
