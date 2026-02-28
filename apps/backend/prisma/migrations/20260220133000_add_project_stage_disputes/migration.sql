-- CreateTable
CREATE TABLE "project_stage_disputes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "generalContractorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "otherReason" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "inReviewAt" TIMESTAMP(3),

    CONSTRAINT "project_stage_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_stage_disputes_status_createdAt_idx" ON "project_stage_disputes"("status", "createdAt");

-- CreateIndex
CREATE INDEX "project_stage_disputes_projectId_stageId_createdAt_idx" ON "project_stage_disputes"("projectId", "stageId", "createdAt");

-- AddForeignKey
ALTER TABLE "project_stage_disputes" ADD CONSTRAINT "project_stage_disputes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stage_disputes" ADD CONSTRAINT "project_stage_disputes_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stage_disputes" ADD CONSTRAINT "project_stage_disputes_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stage_disputes" ADD CONSTRAINT "project_stage_disputes_generalContractorId_fkey" FOREIGN KEY ("generalContractorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
