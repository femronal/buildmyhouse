ALTER TABLE "professional_claim_invites" ADD COLUMN IF NOT EXISTS "rawToken" TEXT;
ALTER TABLE "professional_claim_invites" ADD COLUMN IF NOT EXISTS "emailedAt" TIMESTAMP(3);
ALTER TABLE "professional_claim_invites" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);

ALTER TABLE "artisan_claim_invites" ADD COLUMN IF NOT EXISTS "rawToken" TEXT;
ALTER TABLE "artisan_claim_invites" ADD COLUMN IF NOT EXISTS "emailedAt" TIMESTAMP(3);
ALTER TABLE "artisan_claim_invites" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3);
