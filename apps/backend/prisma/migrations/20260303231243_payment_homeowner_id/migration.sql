-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "homeownerId" TEXT;

-- Backfill homeownerId from project for existing payments
UPDATE "payments" p
SET "homeownerId" = pr."homeownerId"
FROM "projects" pr
WHERE p."projectId" = pr.id
  AND p."homeownerId" IS NULL;
