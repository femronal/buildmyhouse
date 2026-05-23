-- User intro onboarding fields
ALTER TABLE "users"
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "homeownerTermsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "gcTermsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "profileSetupCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Contractor onboarding flags
ALTER TABLE "contractors"
ADD COLUMN "professionalOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "professionalOnboardingSkipped" BOOLEAN NOT NULL DEFAULT false;

-- Keep existing users unblocked; this onboarding gate should apply to new signups.
UPDATE "users"
SET
  "profileSetupCompleted" = true,
  "homeownerTermsAcceptedAt" = COALESCE("homeownerTermsAcceptedAt", NOW())
WHERE "role" = 'homeowner';

UPDATE "users"
SET
  "profileSetupCompleted" = true,
  "gcTermsAcceptedAt" = COALESCE("gcTermsAcceptedAt", NOW())
WHERE "role" = 'general_contractor';
