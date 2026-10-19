ALTER TABLE "projects" ADD COLUMN "needsExtraMonitoring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN "monitoringReason" TEXT;
CREATE INDEX "projects_needsExtraMonitoring_idx" ON "projects"("needsExtraMonitoring");
