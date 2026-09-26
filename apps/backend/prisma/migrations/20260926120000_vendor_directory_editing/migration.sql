CREATE TYPE "VendorDeliveryStatus" AS ENUM ('not_confirmed', 'delivers', 'pickup_only');
CREATE TYPE "VendorRegistryStatus" AS ENUM ('active', 'inactive', 'unknown');

ALTER TABLE "vendor_profiles"
  ADD COLUMN "landmark" TEXT,
  ADD COLUMN "localAreaKey" TEXT,
  ADD COLUMN "deliveryStatus" "VendorDeliveryStatus" NOT NULL DEFAULT 'not_confirmed',
  ADD COLUMN "primaryFamilyKey" TEXT,
  ADD COLUMN "secondaryFamilyKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "catalogSearchText" TEXT,
  ADD COLUMN "cacRegisteredName" TEXT,
  ADD COLUMN "cacRegistryStatus" "VendorRegistryStatus",
  ADD COLUMN "cacRegisteredOn" TIMESTAMP(3),
  ADD COLUMN "cacCheckedVia" TEXT,
  ADD COLUMN "cacCheckedAt" TIMESTAMP(3),
  ADD COLUMN "cacCheckedByAdminId" TEXT,
  ADD COLUMN "cacCheckedByName" TEXT,
  ADD COLUMN "lastContactedAt" TIMESTAMP(3),
  ADD COLUMN "emailBounced" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "claimedAt" TIMESTAMP(3),
  ADD COLUMN "claimEmail" TEXT;

CREATE TABLE "vendor_products" (
  "id" TEXT NOT NULL,
  "vendorProfileId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "spec" TEXT,
  "unit" TEXT,
  "brand" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_products_vendorProfileId_idx" ON "vendor_products"("vendorProfileId");
ALTER TABLE "vendor_products"
  ADD CONSTRAINT "vendor_products_vendorProfileId_fkey"
  FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_documents" ADD COLUMN "contentHash" TEXT;
ALTER TABLE "vendor_documents" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Move the first offering category into the primary slot. pop-ceilings becomes ceilings.
UPDATE "vendor_profiles" p
SET "primaryFamilyKey" = CASE
  WHEN o."familyKey" = 'pop-ceilings' THEN 'ceilings'
  ELSE o."familyKey"
END
FROM (
  SELECT DISTINCT ON ("vendorProfileId") "vendorProfileId", "familyKey"
  FROM "vendor_offerings"
  WHERE "familyKey" IS NOT NULL AND "familyKey" <> ''
  ORDER BY "vendorProfileId", "sortOrder" ASC, "createdAt" ASC
) o
WHERE p.id = o."vendorProfileId" AND p."primaryFamilyKey" IS NULL;

-- Metric Woods acceptance data. Private notes are not parsed for other vendors.
UPDATE "vendor_profiles"
SET
  "primaryFamilyKey" = 'timber-wood-panels',
  "secondaryFamilyKeys" = ARRAY[]::TEXT[],
  "websiteUrl" = 'https://metricwoods.ng/',
  "websiteDomain" = 'metricwoods.ng',
  "publicAddress" = 'Ahmed Bola Tinubu Way, opposite the back gate of HFP Complex, Abraham Adesanya, Lekki-Ajah, Eti-Osa, Lagos 101222',
  "localAreaKey" = 'lekki-ajah',
  "localAreaLabel" = 'Lekki/Ajah',
  "cityLabel" = COALESCE("cityLabel", 'Lekki-Ajah'),
  "stateLabel" = COALESCE("stateLabel", 'Lagos'),
  "stateKey" = COALESCE("stateKey", 'ng-lagos'),
  "businessTypes" = ARRAY['manufacturer', 'importer']::TEXT[],
  "cacNumber" = 'RC 1498667',
  "cacRegisteredName" = 'METRICWOODS NIG. LIMITED',
  "cacRegistryStatus" = 'active',
  "cacRegisteredOn" = TIMESTAMP '2018-05-28',
  "cacCheckedVia" = 'CAC ICRP public search',
  "cacRegistrationStatus" = 'registered',
  "deliveryStatus" = 'not_confirmed',
  "showPublicEmail" = true
WHERE slug = 'metric-woods-nigeria-limited';

INSERT INTO "vendor_products" ("id", "vendorProfileId", "name", "sortOrder", "createdAt", "updatedAt")
SELECT md5(p.id || ':' || names.name), p.id, names.name, names.ord, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "vendor_profiles" p
CROSS JOIN (
  VALUES
    ('marine board', 0),
    ('MDF board', 1),
    ('HDF board', 2),
    ('plywood', 3)
) AS names(name, ord)
WHERE p.slug = 'metric-woods-nigeria-limited'
  AND NOT EXISTS (
    SELECT 1 FROM "vendor_products" existing
    WHERE existing."vendorProfileId" = p.id AND lower(existing.name) = lower(names.name)
  );

-- Keep one CAC card when the same file was uploaded twice.
DELETE FROM "vendor_documents" d
USING "vendor_documents" older
WHERE d."vendorProfileId" = older."vendorProfileId"
  AND d."documentType" = older."documentType"
  AND d."fileRef" = older."fileRef"
  AND d."createdAt" > older."createdAt";

DELETE FROM "vendor_documents" d
USING "vendor_profiles" p
WHERE d."vendorProfileId" = p.id
  AND p.slug = 'metric-woods-nigeria-limited'
  AND d."documentType" = 'cac_certificate'
  AND d.id <> (
    SELECT keep.id FROM "vendor_documents" keep
    WHERE keep."vendorProfileId" = p.id AND keep."documentType" = 'cac_certificate'
    ORDER BY keep."createdAt" ASC
    LIMIT 1
  );

UPDATE "vendor_profiles" p
SET
  "claimedAt" = claims.latest,
  "claimEmail" = invites.email
FROM (
  SELECT "vendorProfileId", MAX("createdAt") AS latest
  FROM "vendor_activities"
  WHERE type = 'claim_accepted'
  GROUP BY "vendorProfileId"
) claims
LEFT JOIN LATERAL (
  SELECT email FROM "vendor_claim_invites" i
  WHERE i."vendorProfileId" = claims."vendorProfileId"
  ORDER BY i."usedAt" DESC NULLS LAST, i."createdAt" DESC
  LIMIT 1
) invites ON true
WHERE p.id = claims."vendorProfileId"
  AND p."claimStatus" = 'claimed'
  AND p."claimedAt" IS NULL;

UPDATE "vendor_activities" later
SET
  summary = 'Re-claim recorded',
  metadata = COALESCE(later.metadata, '{}'::jsonb) || '{"reason":"Listing was already claimed"}'::jsonb
FROM "vendor_activities" earlier
WHERE later."vendorProfileId" = earlier."vendorProfileId"
  AND later.type = 'claim_accepted'
  AND earlier.type = 'claim_accepted'
  AND later.summary = 'Vendor claimed profile'
  AND later."createdAt" > earlier."createdAt";

UPDATE "vendor_profiles" p
SET "lastContactedAt" = touches.latest
FROM (
  SELECT "vendorProfileId", MAX("createdAt") AS latest
  FROM "vendor_activities"
  WHERE type IN ('invitation_sent', 'contacted', 'claim_accepted', 'quotation_requested', 'quotation_received')
  GROUP BY "vendorProfileId"
) touches
WHERE p.id = touches."vendorProfileId" AND p."lastContactedAt" IS NULL;

UPDATE "vendor_profiles"
SET "procurementRelationship" = 'contacted'
WHERE "procurementRelationship" = 'never_contacted'
  AND "lastContactedAt" IS NOT NULL;

UPDATE "vendor_profiles" p
SET "catalogSearchText" = lower(concat_ws(' ',
  p.description,
  p."primaryFamilyKey",
  array_to_string(p."secondaryFamilyKeys", ' '),
  (
    SELECT string_agg(coalesce(o."familyKey", '') || ' ' || array_to_string(o.brands, ' '), ' ')
    FROM "vendor_offerings" o
    WHERE o."vendorProfileId" = p.id
  ),
  (
    SELECT string_agg(concat_ws(' ', pr.name, pr.spec, pr.brand), ' ')
    FROM "vendor_products" pr
    WHERE pr."vendorProfileId" = p.id
  )
));
