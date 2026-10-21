-- Plan requests are linked to the design the homeowner picked.
ALTER TABLE "projects" ADD COLUMN "designId" TEXT;

ALTER TABLE "projects"
ADD CONSTRAINT "projects_designId_fkey"
FOREIGN KEY ("designId") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "projects_designId_idx" ON "projects"("designId");

ALTER TABLE "project_requests" ADD COLUMN "contactedAt" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "inspectionDate" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "inspectionFee" DECIMAL(12,2);
ALTER TABLE "project_requests" ADD COLUMN "inspectedAt" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "inspectionPhotoIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "project_requests" ADD COLUMN "homeownerConfirmedContactAt" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "homeownerConfirmedInspectionAt" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "quoteFileId" TEXT;
ALTER TABLE "project_requests" ADD COLUMN "homeownerAcceptedQuoteAt" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "bmhCheckResult" TEXT;
ALTER TABLE "project_requests" ADD COLUMN "bmhCheckNote" TEXT;
ALTER TABLE "project_requests" ADD COLUMN "bmhCheckAt" TIMESTAMP(3);
ALTER TABLE "project_requests" ADD COLUMN "declineReason" TEXT;
ALTER TABLE "project_requests" ADD COLUMN "homeownerDisputedStep" INTEGER;
ALTER TABLE "project_requests" ADD COLUMN "lateNotifiedStep" INTEGER;

-- Clear matches only: the plan image on the project belongs to a design by the requested contractor.
UPDATE "projects" AS p
SET "designId" = matched."designId"
FROM (
  SELECT p2.id AS "projectId", d.id AS "designId"
  FROM "projects" p2
  JOIN "project_requests" r
    ON r."projectId" = p2.id
   AND r."stageId" IS NULL
  JOIN "designs" d
    ON d."createdById" = r."contractorId"
  JOIN "design_images" di
    ON di."designId" = d.id
   AND di.url = p2."aiAnalysis"->>'designPlanImageUrl'
  WHERE p2."designId" IS NULL
    AND COALESCE(p2."aiAnalysis"->>'designPlanImageUrl', '') <> ''
  GROUP BY p2.id, d.id
) AS matched
WHERE p.id = matched."projectId"
  AND p."designId" IS NULL
  AND (
    SELECT COUNT(DISTINCT d2.id)
    FROM "project_requests" r2
    JOIN "designs" d2 ON d2."createdById" = r2."contractorId"
    JOIN "design_images" di2
      ON di2."designId" = d2.id
     AND di2.url = p."aiAnalysis"->>'designPlanImageUrl'
    WHERE r2."projectId" = p.id
      AND r2."stageId" IS NULL
  ) = 1;
