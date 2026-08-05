-- AlterTable: User access session + security fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adminAccessVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastPasswordChangeAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastFailedLoginAt" TIMESTAMP(3);

-- AlterTable: mark critical permissions
ALTER TABLE "hr_admin_permissions" ADD COLUMN IF NOT EXISTS "isCritical" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_access_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffProfileId" TEXT,
    "accessRelationship" TEXT NOT NULL DEFAULT 'external',
    "status" TEXT NOT NULL DEFAULT 'invited',
    "organisation" TEXT,
    "accessReason" TEXT,
    "sponsorUserId" TEXT,
    "accessStartsAt" TIMESTAMP(3),
    "accessExpiresAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspendedUntil" TIMESTAMP(3),
    "suspendReason" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_access_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_access_profiles_userId_key" ON "admin_access_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_access_profiles_staffProfileId_key" ON "admin_access_profiles"("staffProfileId");
CREATE INDEX IF NOT EXISTS "admin_access_profiles_status_idx" ON "admin_access_profiles"("status");
CREATE INDEX IF NOT EXISTS "admin_access_profiles_accessExpiresAt_idx" ON "admin_access_profiles"("accessExpiresAt");
CREATE INDEX IF NOT EXISTS "admin_access_profiles_accessRelationship_idx" ON "admin_access_profiles"("accessRelationship");

CREATE TABLE IF NOT EXISTS "admin_user_role_assignments" (
    "id" TEXT NOT NULL,
    "accessProfileId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "grantedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_user_role_assignments_accessProfileId_revokedAt_idx" ON "admin_user_role_assignments"("accessProfileId", "revokedAt");
CREATE INDEX IF NOT EXISTS "admin_user_role_assignments_roleId_idx" ON "admin_user_role_assignments"("roleId");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_user_role_assignments_accessProfileId_roleId_key" ON "admin_user_role_assignments"("accessProfileId", "roleId");

CREATE TABLE IF NOT EXISTS "admin_permission_overrides" (
    "id" TEXT NOT NULL,
    "accessProfileId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "reason" TEXT,
    "grantedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permission_overrides_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_permission_overrides_accessProfileId_revokedAt_idx" ON "admin_permission_overrides"("accessProfileId", "revokedAt");
CREATE INDEX IF NOT EXISTS "admin_permission_overrides_permissionId_idx" ON "admin_permission_overrides"("permissionId");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_permission_overrides_accessProfileId_permissionId_effect_key" ON "admin_permission_overrides"("accessProfileId", "permissionId", "effect");

CREATE TABLE IF NOT EXISTS "admin_invitations" (
    "id" TEXT NOT NULL,
    "accessProfileId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_invitations_tokenHash_key" ON "admin_invitations"("tokenHash");
CREATE INDEX IF NOT EXISTS "admin_invitations_accessProfileId_expiresAt_idx" ON "admin_invitations"("accessProfileId", "expiresAt");
CREATE INDEX IF NOT EXISTS "admin_invitations_email_idx" ON "admin_invitations"("email");

CREATE TABLE IF NOT EXISTS "admin_access_requests" (
    "id" TEXT NOT NULL,
    "requestingUserId" TEXT NOT NULL,
    "permissionId" TEXT,
    "permissionKey" TEXT NOT NULL,
    "businessReason" TEXT NOT NULL,
    "requestedDuration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerUserId" TEXT,
    "decisionNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_access_requests_status_createdAt_idx" ON "admin_access_requests"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_access_requests_requestingUserId_createdAt_idx" ON "admin_access_requests"("requestingUserId", "createdAt");

CREATE TABLE IF NOT EXISTS "admin_access_audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "action" TEXT NOT NULL,
    "summary" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_access_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_access_audit_log_targetUserId_createdAt_idx" ON "admin_access_audit_log"("targetUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_access_audit_log_actorUserId_createdAt_idx" ON "admin_access_audit_log"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_access_audit_log_action_createdAt_idx" ON "admin_access_audit_log"("action", "createdAt");

-- Foreign keys (idempotent-ish: ignore if already present via DO blocks)
DO $$ BEGIN
  ALTER TABLE "admin_access_profiles" ADD CONSTRAINT "admin_access_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_profiles" ADD CONSTRAINT "admin_access_profiles_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "hr_staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_profiles" ADD CONSTRAINT "admin_access_profiles_sponsorUserId_fkey" FOREIGN KEY ("sponsorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_profiles" ADD CONSTRAINT "admin_access_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_user_role_assignments" ADD CONSTRAINT "admin_user_role_assignments_accessProfileId_fkey" FOREIGN KEY ("accessProfileId") REFERENCES "admin_access_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_user_role_assignments" ADD CONSTRAINT "admin_user_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "hr_admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_user_role_assignments" ADD CONSTRAINT "admin_user_role_assignments_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_accessProfileId_fkey" FOREIGN KEY ("accessProfileId") REFERENCES "admin_access_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "hr_admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_accessProfileId_fkey" FOREIGN KEY ("accessProfileId") REFERENCES "admin_access_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_invitations" ADD CONSTRAINT "admin_invitations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_requests" ADD CONSTRAINT "admin_access_requests_requestingUserId_fkey" FOREIGN KEY ("requestingUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_requests" ADD CONSTRAINT "admin_access_requests_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_requests" ADD CONSTRAINT "admin_access_requests_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "hr_admin_permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_audit_log" ADD CONSTRAINT "admin_access_audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "admin_access_audit_log" ADD CONSTRAINT "admin_access_audit_log_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
