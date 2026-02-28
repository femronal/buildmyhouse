-- Design admin review workflow: uploaded plans must be approved before going live.
ALTER TABLE "designs"
ADD COLUMN "adminApprovalStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "adminReviewedAt" TIMESTAMP(3),
ADD COLUMN "adminReviewedById" TEXT;

ALTER TABLE "designs"
ADD CONSTRAINT "designs_adminReviewedById_fkey"
FOREIGN KEY ("adminReviewedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "designs_adminApprovalStatus_idx" ON "designs"("adminApprovalStatus");
