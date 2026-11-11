-- New tracking starts now. Existing rows stay empty on purpose. No backfill.

ALTER TABLE "stage_team_members" ADD COLUMN "invoicedAt" TIMESTAMP(3);
ALTER TABLE "stage_materials" ADD COLUMN "invoicedAt" TIMESTAMP(3);
ALTER TABLE "contractors" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN "confirmedById" TEXT;

CREATE INDEX "payments_confirmedById_idx" ON "payments"("confirmedById");

ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL;

CREATE TABLE "weekly_report_sends" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sending',
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "weekly_report_sends_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weekly_report_sends_weekStart_key" ON "weekly_report_sends"("weekStart");

CREATE TABLE "weekly_report_recipients" (
    "id" TEXT NOT NULL,
    "sendId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "weekly_report_recipients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weekly_report_recipients_sendId_userId_key" ON "weekly_report_recipients"("sendId", "userId");

ALTER TABLE "weekly_report_recipients" ADD CONSTRAINT "weekly_report_recipients_sendId_fkey" FOREIGN KEY ("sendId") REFERENCES "weekly_report_sends"("id") ON DELETE CASCADE;
