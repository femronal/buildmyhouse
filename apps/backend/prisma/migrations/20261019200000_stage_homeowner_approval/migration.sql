ALTER TABLE "projects" ADD COLUMN "acceptedById" TEXT;
ALTER TABLE "projects" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "stages" ADD COLUMN "submittedForApprovalAt" TIMESTAMP(3);
ALTER TABLE "stages" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "stages" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "stages" ADD COLUMN "approvalMethod" TEXT;
ALTER TABLE "stages" ADD COLUMN "approvalNote" TEXT;
ALTER TABLE "stages" ADD COLUMN "approvalEvidenceUrl" TEXT;
ALTER TABLE "stages" ADD COLUMN "lastApprovalReminderAt" TIMESTAMP(3);
ALTER TABLE "stages" ADD COLUMN "approvalReminderCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "projects" ADD CONSTRAINT "projects_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stages" ADD CONSTRAINT "stages_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "stages_status_idx" ON "stages"("status");
