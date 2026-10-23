ALTER TABLE "stage_materials" ADD COLUMN "payeeKind" TEXT;
ALTER TABLE "stage_materials" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'planned';
ALTER TABLE "stage_materials" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "stage_materials" ADD COLUMN "hoPaymentRef" TEXT;

UPDATE "stage_materials"
SET
  "payeeKind" = 'shop',
  "notes" = CASE
    WHEN "notes" IS NULL OR BTRIM("notes") = '' THEN 'Review payee kind. Backfilled as shop.'
    ELSE "notes" || E'\nReview payee kind. Backfilled as shop.'
  END
WHERE "payeeKind" IS NULL;

ALTER TABLE "stage_materials" ALTER COLUMN "payeeKind" SET NOT NULL;

ALTER TABLE "stage_team_members" ADD COLUMN "payStatus" TEXT NOT NULL DEFAULT 'planned';
ALTER TABLE "stage_team_members" ADD COLUMN "paidAmount" DOUBLE PRECISION;
ALTER TABLE "stage_team_members" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "stage_team_members" ADD COLUMN "paidBy" TEXT;
ALTER TABLE "stage_team_members" ADD COLUMN "hoPaymentRef" TEXT;
