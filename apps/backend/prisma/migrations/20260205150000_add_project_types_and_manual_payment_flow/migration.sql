-- Add project type + admin review/manual payment fields

DO $$ BEGIN
  CREATE TYPE "ProjectType" AS ENUM ('homebuilding', 'renovation', 'interior_design');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectReviewStatus" AS ENUM ('pending_admin_review', 'changes_requested', 'approved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentConfirmationStatus" AS ENUM ('not_declared', 'declared', 'confirmed', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "projectType" "ProjectType",
  ADD COLUMN IF NOT EXISTS "reviewStatus" "ProjectReviewStatus",
  ADD COLUMN IF NOT EXISTS "externalPaymentLink" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentDeclaredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paymentConfirmedAt" TIMESTAMP(3);

DO $$ BEGIN
  ALTER TABLE "projects"
    ADD COLUMN "paymentConfirmationStatus" "PaymentConfirmationStatus" NOT NULL DEFAULT 'not_declared';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Stripe identifiers / Connect fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

ALTER TABLE "contractors"
  ADD COLUMN IF NOT EXISTS "connectAccountId" TEXT;

