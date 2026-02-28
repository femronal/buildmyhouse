-- Ensure project classification is persisted for every project.
-- Existing null rows are treated as home construction.
UPDATE "projects"
SET "projectType" = 'homebuilding'
WHERE "projectType" IS NULL;

ALTER TABLE "projects"
ALTER COLUMN "projectType" SET DEFAULT 'homebuilding';
