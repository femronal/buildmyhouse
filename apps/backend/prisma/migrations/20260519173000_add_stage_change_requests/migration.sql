-- CreateEnum
CREATE TYPE "StageChangeRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "stage_change_requests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "status" "StageChangeRequestStatus" NOT NULL DEFAULT 'pending',
    "requestTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additionalAmount" DOUBLE PRECISION,
    "additionalDurationDays" INTEGER,
    "requestedSiteChange" BOOLEAN NOT NULL DEFAULT false,
    "siteChangeDetails" TEXT,
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "adminReviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stage_change_requests_projectId_stageId_createdAt_idx" ON "stage_change_requests"("projectId", "stageId", "createdAt");

-- CreateIndex
CREATE INDEX "stage_change_requests_status_createdAt_idx" ON "stage_change_requests"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "stage_change_requests" ADD CONSTRAINT "stage_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_change_requests" ADD CONSTRAINT "stage_change_requests_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_change_requests" ADD CONSTRAINT "stage_change_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_change_requests" ADD CONSTRAINT "stage_change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
