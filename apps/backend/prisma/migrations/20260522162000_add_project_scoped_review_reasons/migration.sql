ALTER TABLE "reviews"
ADD COLUMN "projectId" TEXT,
ADD COLUMN "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "otherReason" TEXT;

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "reviews_projectId_idx" ON "reviews"("projectId");

CREATE UNIQUE INDEX "reviews_userId_contractorId_projectId_key"
ON "reviews"("userId", "contractorId", "projectId");
