-- Founding affiliate program: versioned rules, customer locks, commission ledger, marketing campaigns.

CREATE TYPE "PartnerApplicationStatus" AS ENUM ('none', 'applied', 'approved', 'suspended');
CREATE TYPE "ReferralRuleProgram" AS ENUM ('affiliate', 'referrer');
CREATE TYPE "ReferralRuleStatus" AS ENUM ('draft', 'published', 'retired');
CREATE TYPE "PartnerAgreementStatus" AS ENUM ('active', 'ended');
CREATE TYPE "CommissionStatus" AS ENUM ('awaiting_checks', 'needs_review', 'approved', 'paid', 'reversed');
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('draft', 'approved');

ALTER TABLE "referrers"
  ADD COLUMN "applicationStatus" "PartnerApplicationStatus" NOT NULL DEFAULT 'none',
  ADD COLUMN "appliedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "audience" TEXT;

CREATE INDEX "referrers_applicationStatus_idx" ON "referrers"("applicationStatus");

CREATE TABLE "referral_program_rules" (
  "id" TEXT NOT NULL,
  "program" "ReferralRuleProgram" NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ReferralRuleStatus" NOT NULL DEFAULT 'draft',
  "rateBps" INTEGER,
  "rateBase" TEXT NOT NULL DEFAULT 'contractor_amount',
  "fundingSource" TEXT NOT NULL DEFAULT 'controlling_fee',
  "contingencyExcluded" BOOLEAN NOT NULL DEFAULT true,
  "clickWindowDays" INTEGER NOT NULL DEFAULT 30,
  "attributionRule" TEXT NOT NULL DEFAULT 'first_touch',
  "lifetime" BOOLEAN NOT NULL DEFAULT false,
  "rewardKind" TEXT NOT NULL DEFAULT 'percent',
  "fixedRewardNaira" DOUBLE PRECISION,
  "publishedAt" TIMESTAMP(3),
  "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "referral_program_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_program_rules_program_version_key" ON "referral_program_rules"("program", "version");
CREATE INDEX "referral_program_rules_program_status_idx" ON "referral_program_rules"("program", "status");

CREATE TABLE "partner_agreements" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "ruleId" TEXT,
  "rateBps" INTEGER NOT NULL,
  "lifetime" BOOLEAN NOT NULL DEFAULT true,
  "status" "PartnerAgreementStatus" NOT NULL DEFAULT 'active',
  "agreementVersion" TEXT NOT NULL DEFAULT 'founding-affiliates-2026-11',
  "acceptedAt" TIMESTAMP(3),
  "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_agreements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "partner_agreements_referrerId_status_idx" ON "partner_agreements"("referrerId", "status");

CREATE TABLE "referral_clicks" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "landingPath" TEXT NOT NULL,
  "campaignSlug" TEXT,
  "anonymousId" TEXT,
  "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_clicks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referral_clicks_referrerId_clickedAt_idx" ON "referral_clicks"("referrerId", "clickedAt");
CREATE INDEX "referral_clicks_anonymousId_clickedAt_idx" ON "referral_clicks"("anonymousId", "clickedAt");
CREATE INDEX "referral_clicks_code_expiresAt_idx" ON "referral_clicks"("code", "expiresAt");

CREATE TABLE "customer_attributions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "clickId" TEXT,
  "campaignSlug" TEXT,
  "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_attributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_attributions_userId_key" ON "customer_attributions"("userId");
CREATE INDEX "customer_attributions_referrerId_idx" ON "customer_attributions"("referrerId");

CREATE TABLE "partner_commissions" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "homeownerId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "agreementId" TEXT,
  "ruleId" TEXT,
  "eligibleContractorAmount" DOUBLE PRECISION NOT NULL,
  "controllingFeeAmount" DOUBLE PRECISION NOT NULL,
  "contingencyAmount" DOUBLE PRECISION NOT NULL,
  "rateBps" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" "CommissionStatus" NOT NULL DEFAULT 'awaiting_checks',
  "reviewReasons" TEXT,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "paidAt" TIMESTAMP(3),
  "paymentReference" TEXT,
  "reversedAt" TIMESTAMP(3),
  "reversalReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_commissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_commissions_projectId_key" ON "partner_commissions"("projectId");
CREATE INDEX "partner_commissions_referrerId_status_idx" ON "partner_commissions"("referrerId", "status");
CREATE INDEX "partner_commissions_status_calculatedAt_idx" ON "partner_commissions"("status", "calculatedAt");

CREATE TABLE "partner_payout_profiles" (
  "referrerId" TEXT NOT NULL,
  "accountName" TEXT,
  "bankName" TEXT,
  "accountNumber" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "taxId" TEXT,
  "notifyEarnings" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "partner_payout_profiles_pkey" PRIMARY KEY ("referrerId")
);

CREATE TABLE "partner_login_tokens" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_login_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_login_tokens_tokenHash_key" ON "partner_login_tokens"("tokenHash");
CREATE INDEX "partner_login_tokens_referrerId_idx" ON "partner_login_tokens"("referrerId");

CREATE TABLE "marketing_campaigns" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "audience" TEXT NOT NULL,
  "problem" TEXT NOT NULL,
  "promise" TEXT NOT NULL,
  "destinationPath" TEXT NOT NULL,
  "caption" TEXT NOT NULL,
  "disclosure" TEXT NOT NULL,
  "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'approved',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketing_campaigns_slug_key" ON "marketing_campaigns"("slug");

ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_agreements" ADD CONSTRAINT "partner_agreements_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "referral_program_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_attributions" ADD CONSTRAINT "customer_attributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_attributions" ADD CONSTRAINT "customer_attributions_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_attributions" ADD CONSTRAINT "customer_attributions_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "referral_clicks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "partner_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "referral_program_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_commissions" ADD CONSTRAINT "partner_commissions_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partner_payout_profiles" ADD CONSTRAINT "partner_payout_profiles_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partner_login_tokens" ADD CONSTRAINT "partner_login_tokens_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "referral_program_rules" (
  "id", "program", "version", "status", "rateBps", "rateBase", "fundingSource",
  "contingencyExcluded", "clickWindowDays", "attributionRule", "lifetime", "rewardKind",
  "publishedAt", "createdAt", "updatedAt"
) VALUES (
  '11111111-1111-4111-8111-111111111111', 'affiliate', 1, 'published', 250, 'contractor_amount', 'controlling_fee',
  true, 30, 'first_touch', true, 'percent',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "referral_program_rules" (
  "id", "program", "version", "status", "rateBase", "fundingSource",
  "contingencyExcluded", "clickWindowDays", "attributionRule", "lifetime", "rewardKind",
  "createdAt", "updatedAt"
) VALUES (
  '22222222-2222-4222-8222-222222222222', 'referrer', 1, 'draft', 'contractor_amount', 'unpublished',
  true, 30, 'first_touch', false, 'unpublished',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO "marketing_campaigns" (
  "id", "slug", "title", "audience", "problem", "promise", "destinationPath", "caption", "disclosure", "status", "sortOrder", "createdAt", "updatedAt"
) VALUES
(
  '33333333-3333-4333-8333-333333333333',
  'price-checker',
  'Price Checker',
  'Homeowners comparing material prices',
  'People pay for cement, rods or roofing materials without knowing what the market is charging.',
  'Check what the market is saying before you pay.',
  '/tools/price-checker',
  'Before paying for cement, rods or roofing materials, check what the market is saying.',
  'I may earn a commission if you complete a project with BuildMyHouse after using my link.',
  'approved',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  '44444444-4444-4444-8444-444444444444',
  'renovation-budget',
  'Renovation Budget Planner',
  'People renovating a family house',
  'Renovation costs are unclear before the work starts.',
  'Understand what the work may cost before you commit.',
  '/tools/renovation-budget-planner',
  'Want to renovate your family house in Nigeria? Start by understanding what the work may cost.',
  'I may earn a commission if you complete a project with BuildMyHouse after using my link.',
  'approved',
  2,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  '55555555-5555-4555-8555-555555555555',
  'milestone-payments',
  'Milestone Payment Schedule',
  'Nigerians funding construction from abroad',
  'Money is sent before it is clear what should be finished first.',
  'Work out what should be completed before the next payment.',
  '/tools/milestone-payment-schedule',
  'Before sending the next payment, work out what should be completed first.',
  'I may earn a commission if you complete a project with BuildMyHouse after using my link.',
  'approved',
  3,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
