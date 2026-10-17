-- Claimed professional accounts that are still homeowners become general contractors.
-- The listing claim is unchanged. New contractor profiles stay unverified.
-- Admins, vendors, and existing contractor profiles are left alone.

WITH claimed AS (
  SELECT DISTINCT ON (u.id)
    u.id AS user_id,
    COALESCE(NULLIF(BTRIM(u."fullName"), ''), NULLIF(BTRIM(pl."displayName"), ''), 'General Contractor') AS contractor_name,
    COALESCE(NULLIF(BTRIM(pc.label), ''), 'General Contractor') AS profession,
    NULLIF(
      CONCAT_WS(', ', NULLIF(BTRIM(pl.city), ''), NULLIF(BTRIM(pl.state), '')),
      ''
    ) AS location,
    pl."yearsExperience" AS years_experience
  FROM "professional_listings" pl
  JOIN "users" u ON u.id = pl."claimedByUserId" OR u.id = pl."linkedUserId"
  LEFT JOIN "profession_catalog" pc ON pc.id = pl."primaryProfessionId"
  WHERE u.role = 'homeowner'
  ORDER BY u.id, pl."claimedAt" DESC NULLS LAST, pl."createdAt" DESC
)
INSERT INTO "contractors" (
  "id",
  "userId",
  "name",
  "specialty",
  "specialtyCategory",
  "specialtyTags",
  "location",
  "experienceYears",
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
  claimed.user_id,
  claimed.contractor_name,
  claimed.profession,
  'general_contractor',
  ARRAY[claimed.profession],
  claimed.location,
  claimed.years_experience,
  0,
  0,
  0,
  false,
  0,
  'general_contractor',
  'general_contractor',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM claimed
WHERE NOT EXISTS (
  SELECT 1 FROM "contractors" existing WHERE existing."userId" = claimed.user_id
);

WITH claimed AS (
  SELECT DISTINCT u.id AS user_id
  FROM "professional_listings" pl
  JOIN "users" u ON u.id = pl."claimedByUserId" OR u.id = pl."linkedUserId"
  WHERE u.role = 'homeowner'
)
UPDATE "users" u
SET
  role = 'general_contractor',
  "profileSetupCompleted" = true,
  "updatedAt" = CURRENT_TIMESTAMP
FROM claimed
WHERE u.id = claimed.user_id
  AND u.role = 'homeowner';

WITH claimed AS (
  SELECT DISTINCT ON (u.id)
    u.id AS user_id,
    COALESCE(NULLIF(BTRIM(u."fullName"), ''), NULLIF(BTRIM(pl."displayName"), ''), 'General Contractor') AS contractor_name,
    COALESCE(NULLIF(BTRIM(pc.label), ''), 'General Contractor') AS profession,
    NULLIF(
      CONCAT_WS(', ', NULLIF(BTRIM(pl.city), ''), NULLIF(BTRIM(pl.state), '')),
      ''
    ) AS location,
    pl."yearsExperience" AS years_experience
  FROM "professional_listings" pl
  JOIN "users" u ON u.id = pl."claimedByUserId" OR u.id = pl."linkedUserId"
  LEFT JOIN "profession_catalog" pc ON pc.id = pl."primaryProfessionId"
  WHERE u.role = 'general_contractor'
  ORDER BY u.id, pl."claimedAt" DESC NULLS LAST, pl."createdAt" DESC
)
INSERT INTO "contractors" (
  "id",
  "userId",
  "name",
  "specialty",
  "specialtyCategory",
  "specialtyTags",
  "location",
  "experienceYears",
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
  claimed.user_id,
  claimed.contractor_name,
  claimed.profession,
  'general_contractor',
  ARRAY[claimed.profession],
  claimed.location,
  claimed.years_experience,
  0,
  0,
  0,
  false,
  0,
  'general_contractor',
  'general_contractor',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM claimed
WHERE NOT EXISTS (
  SELECT 1 FROM "contractors" existing WHERE existing."userId" = claimed.user_id
);
