-- Claimed artisan accounts that are still homeowners become general contractors.
-- New contractor profiles stay unverified. Claiming is not verification.
-- Verification, trust score, claim status, and money tables are unchanged.
-- A homeowner who already owns a project is skipped and needs a manual decision by Femi.
-- The NOT EXISTS checks below are what skip those accounts.
-- This includes Yunusa Usman (uthman@designfab.com.ng) and Designfab Metal Works
-- only when his user is already linkedUserId on that listing. It does not create that link.

WITH eligible AS (
  SELECT DISTINCT ON (u.id)
    u.id AS user_id,
    COALESCE(NULLIF(BTRIM(u."fullName"), ''), NULLIF(BTRIM(al."displayName"), ''), 'Artisan') AS contractor_name
  FROM "artisan_listings" al
  JOIN "users" u ON u.id = al."linkedUserId"
  WHERE u.role = 'homeowner'
    AND NOT EXISTS (
      SELECT 1 FROM "projects" p WHERE p."homeownerId" = u.id
    )
  ORDER BY u.id, al."claimedAt" DESC NULLS LAST, al."createdAt" DESC
)
INSERT INTO "contractors" (
  "id",
  "userId",
  "name",
  "specialty",
  "specialtyCategory",
  "specialtyTags",
  "rating",
  "reviews",
  "projects",
  "verified",
  "hiringFee",
  "type",
  "platformKind",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  eligible.user_id,
  eligible.contractor_name,
  'Artisan',
  'artisan',
  ARRAY['Artisan'],
  0,
  0,
  0,
  false,
  0,
  'general_contractor',
  'artisan',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM eligible
WHERE NOT EXISTS (
  SELECT 1 FROM "contractors" existing WHERE existing."userId" = eligible.user_id
);

WITH eligible AS (
  SELECT DISTINCT u.id AS user_id
  FROM "artisan_listings" al
  JOIN "users" u ON u.id = al."linkedUserId"
  WHERE u.role = 'homeowner'
    AND NOT EXISTS (
      SELECT 1 FROM "projects" p WHERE p."homeownerId" = u.id
    )
)
UPDATE "users" u
SET
  role = 'general_contractor',
  "profileSetupCompleted" = true,
  "artisanClaimAccess" = true,
  "updatedAt" = CURRENT_TIMESTAMP
FROM eligible
WHERE u.id = eligible.user_id
  AND u.role = 'homeowner';

WITH eligible AS (
  SELECT DISTINCT ON (u.id)
    u.id AS user_id,
    COALESCE(NULLIF(BTRIM(u."fullName"), ''), NULLIF(BTRIM(al."displayName"), ''), 'Artisan') AS contractor_name
  FROM "artisan_listings" al
  JOIN "users" u ON u.id = al."linkedUserId"
  WHERE u.role = 'general_contractor'
    AND NOT EXISTS (
      SELECT 1 FROM "projects" p WHERE p."homeownerId" = u.id
    )
  ORDER BY u.id, al."claimedAt" DESC NULLS LAST, al."createdAt" DESC
)
INSERT INTO "contractors" (
  "id",
  "userId",
  "name",
  "specialty",
  "specialtyCategory",
  "specialtyTags",
  "rating",
  "reviews",
  "projects",
  "verified",
  "hiringFee",
  "type",
  "platformKind",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  eligible.user_id,
  eligible.contractor_name,
  'Artisan',
  'artisan',
  ARRAY['Artisan'],
  0,
  0,
  0,
  false,
  0,
  'general_contractor',
  'artisan',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM eligible
WHERE NOT EXISTS (
  SELECT 1 FROM "contractors" existing WHERE existing."userId" = eligible.user_id
);

UPDATE "artisan_listings" al
SET
  "linkedContractorId" = c.id,
  "updatedAt" = CURRENT_TIMESTAMP
FROM "users" u
JOIN "contractors" c ON c."userId" = u.id
WHERE al."linkedUserId" = u.id
  AND al."linkedContractorId" IS NULL
  AND u.role = 'general_contractor'
  AND u."artisanClaimAccess" = true
  AND NOT EXISTS (
    SELECT 1 FROM "projects" p WHERE p."homeownerId" = u.id
  );
