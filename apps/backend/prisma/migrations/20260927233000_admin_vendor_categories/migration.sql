-- Admin-managed vendor categories. Existing slugs are preserved.
CREATE TABLE "vendor_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_categories_slug_key" ON "vendor_categories"("slug");
CREATE INDEX "vendor_categories_parentId_sortOrder_idx" ON "vendor_categories"("parentId", "sortOrder");
CREATE INDEX "vendor_categories_isActive_idx" ON "vendor_categories"("isActive");
CREATE TABLE "vendor_category_links" (
  "id" TEXT NOT NULL,
  "vendorProfileId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_category_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_category_links_vendorProfileId_categoryId_key" ON "vendor_category_links"("vendorProfileId", "categoryId");
CREATE INDEX "vendor_category_links_categoryId_idx" ON "vendor_category_links"("categoryId");
CREATE INDEX "vendor_category_links_vendorProfileId_isPrimary_idx" ON "vendor_category_links"("vendorProfileId", "isPrimary");
CREATE TABLE "vendor_category_redirects" (
  "id" TEXT NOT NULL,
  "fromSlug" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_category_redirects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_category_redirects_fromSlug_key" ON "vendor_category_redirects"("fromSlug");
CREATE INDEX "vendor_category_redirects_categoryId_idx" ON "vendor_category_redirects"("categoryId");
CREATE TABLE "vendor_category_audits" (
  "id" TEXT NOT NULL,
  "actorAdminId" TEXT,
  "action" TEXT NOT NULL,
  "categoryId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vendor_category_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vendor_category_audits_categoryId_createdAt_idx" ON "vendor_category_audits"("categoryId", "createdAt");
ALTER TABLE "vendor_categories" ADD CONSTRAINT "vendor_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "vendor_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_category_links" ADD CONSTRAINT "vendor_category_links_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_category_links" ADD CONSTRAINT "vendor_category_links_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "vendor_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendor_category_redirects" ADD CONSTRAINT "vendor_category_redirects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "vendor_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-structure', 'Structure', 'structure', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-finishes', 'Finishes', 'finishes', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-doors-windows', 'Doors & windows', 'doors-windows', 2, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-plumbing-sanitary', 'Plumbing & sanitary', 'plumbing-sanitary', 3, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-electrical-power', 'Electrical & power', 'electrical-power', 4, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-wood-furniture', 'Wood & furniture', 'wood-furniture', 5, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "sortOrder", "isActive", "updatedAt") VALUES ('cat-outdoor', 'Outdoor', 'outdoor', 6, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "description", "sortOrder", "isActive", "updatedAt") VALUES ('cat-other', 'Other', 'other', 'Used when a vendor has no matching category.', 7, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-cement', 'Cement', 'cement', 'cat-structure', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-reinforcement-steel', 'Steel', 'reinforcement-steel', 'cat-structure', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-concrete-blocks', 'Blocks', 'concrete-blocks', 'cat-structure', 2, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-sand', 'Sand', 'sand', 'cat-structure', 3, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-granite-aggregates', 'Granite & aggregates', 'granite-aggregates', 'cat-structure', 4, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-formwork-scaffolding', 'Formwork & scaffolding', 'formwork-scaffolding', 'cat-structure', 5, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-roofing', 'Roofing', 'roofing', 'cat-structure', 6, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-waterproofing', 'Waterproofing', 'waterproofing', 'cat-structure', 7, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-tiles', 'Tiles', 'tiles', 'cat-finishes', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-paint', 'Paint', 'paint', 'cat-finishes', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-ceilings', 'Ceilings', 'ceilings', 'cat-finishes', 2, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-flooring', 'Flooring', 'flooring', 'cat-finishes', 3, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-sealants-adhesives-chemicals', 'Sealants, adhesives & chemicals', 'sealants-adhesives-chemicals', 'cat-finishes', 4, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-doors', 'Doors', 'doors', 'cat-doors-windows', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-aluminium-windows', 'Aluminium windows', 'aluminium-windows', 'cat-doors-windows', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-glass-glazing', 'Glass & glazing', 'glass-glazing', 'cat-doors-windows', 2, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-aluminium-profiles-cladding', 'Aluminium profiles & cladding', 'aluminium-profiles-cladding', 'cat-doors-windows', 3, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-hardware-ironmongery', 'Hardware & ironmongery', 'hardware-ironmongery', 'cat-doors-windows', 4, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-plumbing-pipes', 'Plumbing', 'plumbing-pipes', 'cat-plumbing-sanitary', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-sanitary-ware', 'Sanitary ware', 'sanitary-ware', 'cat-plumbing-sanitary', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-water-pumps', 'Pumps', 'water-pumps', 'cat-plumbing-sanitary', 2, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-water-tanks', 'Water tanks', 'water-tanks', 'cat-plumbing-sanitary', 3, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-electrical-cables', 'Electrical cables', 'electrical-cables', 'cat-electrical-power', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-lighting-electrical-fittings', 'Lighting & electrical fittings', 'lighting-electrical-fittings', 'cat-electrical-power', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-solar-panels', 'Solar', 'solar-panels', 'cat-electrical-power', 2, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-inverters', 'Inverters', 'inverters', 'cat-electrical-power', 3, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-batteries', 'Batteries', 'batteries', 'cat-electrical-power', 4, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-generators', 'Generators', 'generators', 'cat-electrical-power', 5, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-air-conditioning-ventilation', 'Air conditioning & ventilation', 'air-conditioning-ventilation', 'cat-electrical-power', 6, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-cctv-security', 'CCTV & security', 'cctv-security', 'cat-electrical-power', 7, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-timber-wood-panels', 'Timber & wood panels', 'timber-wood-panels', 'cat-wood-furniture', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-furniture-joinery', 'Furniture & joinery', 'furniture-joinery', 'cat-wood-furniture', 1, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-gates-fencing-steelwork', 'Gates, fencing & steelwork', 'gates-fencing-steelwork', 'cat-outdoor', 0, true, CURRENT_TIMESTAMP);
INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt") VALUES ('cat-paving-interlocking', 'Paving & interlocking', 'paving-interlocking', 'cat-outdoor', 1, true, CURRENT_TIMESTAMP);
-- Older public slug.
INSERT INTO "vendor_category_redirects" ("id", "fromSlug", "categoryId") VALUES ('redir-pop-ceilings', 'pop-ceilings', 'cat-ceilings');
UPDATE "vendor_profiles" SET "primaryFamilyKey" = 'ceilings' WHERE "primaryFamilyKey" = 'pop-ceilings';

DO $$
DECLARE
  before_count integer;
  after_count integer;
BEGIN
  SELECT count(*) INTO before_count
  FROM "vendor_profiles"
  WHERE "deletedAt" IS NULL
    AND "primaryFamilyKey" IS NOT NULL
    AND btrim("primaryFamilyKey") <> '';

  INSERT INTO "vendor_categories" ("id", "name", "slug", "parentId", "sortOrder", "isActive", "updatedAt")
  SELECT 'cat-' || p."primaryFamilyKey",
         initcap(replace(p."primaryFamilyKey", '-', ' ')),
         p."primaryFamilyKey",
         'cat-other',
         100,
         true,
         CURRENT_TIMESTAMP
  FROM "vendor_profiles" p
  WHERE p."deletedAt" IS NULL
    AND p."primaryFamilyKey" IS NOT NULL
    AND btrim(p."primaryFamilyKey") <> ''
    AND NOT EXISTS (SELECT 1 FROM "vendor_categories" c WHERE c."slug" = p."primaryFamilyKey")
  GROUP BY p."primaryFamilyKey";

  INSERT INTO "vendor_category_links" ("id", "vendorProfileId", "categoryId", "isPrimary")
  SELECT 'link-' || p."id" || '-primary', p."id", c."id", true
  FROM "vendor_profiles" p
  JOIN "vendor_categories" c ON c."slug" = p."primaryFamilyKey"
  WHERE p."deletedAt" IS NULL
    AND p."primaryFamilyKey" IS NOT NULL
    AND btrim(p."primaryFamilyKey") <> '';

  INSERT INTO "vendor_category_links" ("id", "vendorProfileId", "categoryId", "isPrimary")
  SELECT 'link-' || p."id" || '-' || c."slug", p."id", c."id", false
  FROM "vendor_profiles" p
  JOIN LATERAL unnest(p."secondaryFamilyKeys") AS s(slug) ON true
  JOIN "vendor_categories" c ON c."slug" = s.slug
  WHERE p."deletedAt" IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM "vendor_category_links" l
      WHERE l."vendorProfileId" = p."id" AND l."categoryId" = c."id"
    );

  SELECT count(*) INTO after_count FROM "vendor_category_links" WHERE "isPrimary" = true;
  IF after_count < before_count THEN
    RAISE EXCEPTION 'Vendor category migration lost rows: before %, linked %', before_count, after_count;
  END IF;
  RAISE NOTICE 'Vendor categories mapped: before %, primary links %', before_count, after_count;
END $$;

