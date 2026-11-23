-- New table. Existing jobs start with no payout records. No backfill.

CREATE TABLE "contractor_payouts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "gcUserId" TEXT NOT NULL,
    "gcName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "bankReference" TEXT NOT NULL,
    "proofFileUrl" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "bankLabel" TEXT,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "earlyPaymentReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractor_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contractor_payouts_projectId_idx" ON "contractor_payouts"("projectId");
CREATE INDEX "contractor_payouts_stageId_idx" ON "contractor_payouts"("stageId");
CREATE INDEX "contractor_payouts_sentAt_idx" ON "contractor_payouts"("sentAt");

ALTER TABLE "contractor_payouts" ADD CONSTRAINT "contractor_payouts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contractor_payouts" ADD CONSTRAINT "contractor_payouts_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contractor_payouts" ADD CONSTRAINT "contractor_payouts_gcUserId_fkey" FOREIGN KEY ("gcUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contractor_payouts" ADD CONSTRAINT "contractor_payouts_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contractor_payouts" ADD CONSTRAINT "contractor_payouts_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contractor_payouts" ADD CONSTRAINT "contractor_payouts_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
