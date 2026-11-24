-- CreateEnum
CREATE TYPE "PartnerCategory" AS ENUM ('quantity_surveyor', 'property_lawyer', 'architect', 'estate_manager', 'small_developer', 'property_investor_adviser', 'diaspora_group', 'other');

-- CreateEnum
CREATE TYPE "PartnershipStage" AS ENUM ('researching', 'initial_outreach', 'gatekeeper', 'decision_maker_identified', 'conversation_attempted', 'conversation_booked', 'evaluation_completed', 'authority_nurture', 'pilot_candidate', 'pilot_active', 'partnership_discussion', 'active_partner', 'dormant', 'closed_not_interested', 'closed_poor_fit');

-- CreateEnum
CREATE TYPE "FollowUpStep" AS ENUM ('day_0', 'day_4', 'day_10', 'day_21', 'day_60', 'day_90', 'pilot_evaluation');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('cold', 'aware', 'warm', 'engaged', 'strong', 'dormant');

-- CreateEnum
CREATE TYPE "TouchChannel" AS ENUM ('email', 'phone', 'whatsapp', 'google_meet', 'in_person', 'linkedin', 'other');

-- CreateEnum
CREATE TYPE "TouchDirection" AS ENUM ('outbound', 'inbound', 'internal_note');

-- CreateEnum
CREATE TYPE "TouchKind" AS ENUM ('first_outreach', 'authority_proof', 'utility', 'close_the_loop', 'nurture', 'reply', 'meeting_request', 'call_attempt', 'call_connected', 'partner_invite', 'note', 'other');

-- CreateEnum
CREATE TYPE "TouchOutcome" AS ENUM ('no_answer', 'invalid_number', 'not_on_whatsapp', 'gatekeeper_reached', 'decision_maker_reached', 'replied_positive', 'replied_neutral', 'replied_negative', 'asked_for_proposal', 'meeting_proposed', 'meeting_booked', 'dismissed', 'opted_out', 'delivered', 'other');

-- CreateEnum
CREATE TYPE "PartnershipMeetingStatus" AS ENUM ('booked', 'held', 'no_show', 'cancelled');

-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('research_team', 'bot', 'referral', 'inbound', 'event', 'admin', 'sheet_import');

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- DropForeignKey

-- AlterTable

-- CreateTable
CREATE TABLE "partnership_leads" (
    "id" TEXT NOT NULL,
    "leadRef" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyNameNormalised" TEXT NOT NULL,
    "category" "PartnerCategory" NOT NULL,
    "website" TEXT,
    "websiteDomain" TEXT,
    "city" TEXT,
    "state" TEXT,
    "whyTheyMatter" TEXT,
    "whatWeKnow" TEXT,
    "suspectedProblem" TEXT,
    "stage" "PartnershipStage" NOT NULL DEFAULT 'researching',
    "followUpStep" "FollowUpStep" NOT NULL DEFAULT 'day_0',
    "temperature" "LeadTemperature",
    "nextFollowUpOverride" DATE,
    "exactNextAction" TEXT,
    "groupName" TEXT,
    "importKey" TEXT,
    "ownerId" TEXT NOT NULL,
    "sourceType" "LeadSourceType" NOT NULL,
    "sourceDetail" TEXT,
    "sourceUrl" TEXT,
    "referrerId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "lastContactAt" TIMESTAMP(3),
    "lastContactChannel" "TouchChannel",
    "lastOutcome" "TouchOutcome",
    "firstOutreachAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnership_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_contacts" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "emailNormalised" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "linkedinUrl" TEXT,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "doNotContactReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnership_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_touches" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "contactId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "channel" "TouchChannel" NOT NULL,
    "direction" "TouchDirection" NOT NULL,
    "kind" "TouchKind" NOT NULL,
    "outcome" "TouchOutcome",
    "summary" TEXT,
    "stepAtTouch" "FollowUpStep" NOT NULL,
    "dueDateAtTouch" TIMESTAMP(3),
    "fromMailbox" TEXT,
    "toAddress" TEXT,
    "emailSubject" TEXT,
    "loggedById" TEXT NOT NULL,
    "actorLabel" TEXT,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_touches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_meetings" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "contactId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "meetLink" TEXT,
    "status" "PartnershipMeetingStatus" NOT NULL DEFAULT 'booked',
    "outcome" TEXT,
    "bookedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partnership_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_stage_changes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStage" "PartnershipStage",
    "toStage" "PartnershipStage" NOT NULL,
    "fromStep" "FollowUpStep",
    "toStep" "FollowUpStep",
    "reason" TEXT,
    "changedById" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_stage_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_audit_logs" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partnership_leads_leadRef_key" ON "partnership_leads"("leadRef");

-- CreateIndex
CREATE UNIQUE INDEX "partnership_leads_importKey_key" ON "partnership_leads"("importKey");

-- CreateIndex
CREATE UNIQUE INDEX "partnership_leads_referrerId_key" ON "partnership_leads"("referrerId");

-- CreateIndex
CREATE INDEX "partnership_leads_ownerId_stage_idx" ON "partnership_leads"("ownerId", "stage");

-- CreateIndex
CREATE INDEX "partnership_leads_websiteDomain_idx" ON "partnership_leads"("websiteDomain");

-- CreateIndex
CREATE INDEX "partnership_leads_companyNameNormalised_idx" ON "partnership_leads"("companyNameNormalised");

-- CreateIndex
CREATE INDEX "partnership_leads_stage_archivedAt_idx" ON "partnership_leads"("stage", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "partnership_contacts_emailNormalised_key" ON "partnership_contacts"("emailNormalised");

-- CreateIndex
CREATE INDEX "partnership_contacts_leadId_idx" ON "partnership_contacts"("leadId");

-- CreateIndex
CREATE INDEX "partnership_touches_leadId_occurredAt_idx" ON "partnership_touches"("leadId", "occurredAt");

-- CreateIndex
CREATE INDEX "partnership_meetings_leadId_startsAt_idx" ON "partnership_meetings"("leadId", "startsAt");

-- CreateIndex
CREATE INDEX "partnership_stage_changes_leadId_changedAt_idx" ON "partnership_stage_changes"("leadId", "changedAt");

-- CreateIndex
CREATE INDEX "partnership_audit_logs_entity_entityId_idx" ON "partnership_audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "partnership_leads" ADD CONSTRAINT "partnership_leads_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_leads" ADD CONSTRAINT "partnership_leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_leads" ADD CONSTRAINT "partnership_leads_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_contacts" ADD CONSTRAINT "partnership_contacts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "partnership_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_touches" ADD CONSTRAINT "partnership_touches_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "partnership_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_touches" ADD CONSTRAINT "partnership_touches_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "partnership_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_touches" ADD CONSTRAINT "partnership_touches_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_meetings" ADD CONSTRAINT "partnership_meetings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "partnership_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_meetings" ADD CONSTRAINT "partnership_meetings_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "partnership_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_meetings" ADD CONSTRAINT "partnership_meetings_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_stage_changes" ADD CONSTRAINT "partnership_stage_changes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "partnership_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnership_stage_changes" ADD CONSTRAINT "partnership_stage_changes_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


INSERT INTO "hr_admin_roles" ("id", "key", "name", "description", "isSystem", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v.key, v.name, v.description, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('partnership_development_executive', 'Partnership Development Executive', 'Partnership CRM and approved communications. No payroll, payments, or admin management.'),
  ('partnerships_admin', 'Partnerships Admin', 'Partnership/CRM-related tools and appropriate communication access.'),
  ('auditor_read_only', 'Auditor / Read Only', 'Inspect approved data but cannot change it.')
) AS v(key, name, description)
WHERE NOT EXISTS (SELECT 1 FROM "hr_admin_roles" r WHERE r."key" = v.key);

INSERT INTO "hr_admin_permissions" ("id", "key", "groupLabel", "description", "isCritical", "createdAt")
SELECT gen_random_uuid()::text, v.key, 'Growth', v.description, false, CURRENT_TIMESTAMP
FROM (VALUES
  ('partnerships.view', 'View partner leads, follow-ups and meetings'),
  ('partnerships.edit', 'Add leads and log follow-ups and meetings on leads you own'),
  ('partnerships.manage', 'Edit any partner lead, reassign owners, archive and import')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "hr_admin_permissions" p WHERE p."key" = v.key);

INSERT INTO "hr_admin_role_permissions" ("id", "roleId", "permissionId")
SELECT gen_random_uuid()::text, r."id", p."id"
FROM (VALUES
  ('partnership_development_executive', 'partnerships.view'),
  ('partnership_development_executive', 'partnerships.edit'),
  ('partnerships_admin', 'partnerships.view'),
  ('partnerships_admin', 'partnerships.edit'),
  ('partnerships_admin', 'partnerships.manage'),
  ('auditor_read_only', 'partnerships.view')
) AS v(role_key, permission_key)
JOIN "hr_admin_roles" r ON r."key" = v.role_key
JOIN "hr_admin_permissions" p ON p."key" = v.permission_key
WHERE NOT EXISTS (
  SELECT 1 FROM "hr_admin_role_permissions" existing
  WHERE existing."roleId" = r."id" AND existing."permissionId" = p."id"
);
