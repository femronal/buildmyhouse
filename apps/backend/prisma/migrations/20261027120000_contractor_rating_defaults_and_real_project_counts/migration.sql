-- Contractor rating defaults and real project counts.
-- Safe to run more than once. Every statement recomputes from source rows.
-- No review rows are deleted. Money, verification and claim tables are not touched.

ALTER TABLE "contractors" ALTER COLUMN "rating" SET DEFAULT 0;
ALTER TABLE "contractors" ALTER COLUMN "projects" SET DEFAULT 0;

-- 1. projects = number of finished BMH jobs where this contractor's user is the GC.
UPDATE "contractors" c
SET "projects" = COALESCE(sub.cnt, 0)
FROM (
  SELECT c2.id AS contractor_id,
         (SELECT COUNT(*) FROM "projects" p
           WHERE p."generalContractorId" = c2."userId"
             AND (p.status = 'completed' OR (p.progress >= 100 AND p.status <> 'cancelled'))) AS cnt
  FROM "contractors" c2
) sub
WHERE sub.contractor_id = c.id AND c."projects" IS DISTINCT FROM COALESCE(sub.cnt, 0);

-- 2. reviews count and Bayesian rating from real review rows. Zero reviews gives rating 0.
UPDATE "contractors" c
SET "reviews" = COALESCE(r.n, 0),
    "rating" = CASE
      WHEN COALESCE(r.n, 0) = 0 THEN 0
      ELSE ROUND(LEAST(5, GREATEST(1, (r.total + 4.7 * 8) / (r.n + 8)))::numeric, 1)
    END
FROM (
  SELECT c2.id AS contractor_id, COUNT(rv.id)::int AS n, COALESCE(SUM(rv.rating), 0)::float AS total
  FROM "contractors" c2
  LEFT JOIN "reviews" rv ON rv."contractorId" = c2.id
  GROUP BY c2.id
) r
WHERE r.contractor_id = c.id;
