-- CreateTable
CREATE TABLE "cms_resource_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hint" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_resource_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_resource_sections_key_key" ON "cms_resource_sections"("key");

-- AlterTable
ALTER TABLE "cms_articles" ADD COLUMN "resourceSectionKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "cms_articles" ADD COLUMN "articlePillar" TEXT;

-- Seed default sidebar sections (matches articles landing page)
INSERT INTO "cms_resource_sections" ("id", "key", "label", "hint", "sortOrder", "isActive", "isSystem", "createdAt", "updatedAt") VALUES
  ('sec-start-here', 'start-here', 'Start here', 'Flagship guides for diaspora homeowners', 10, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-build-abroad', 'build-abroad', 'Build from abroad', 'New builds, land checks, and remote execution', 20, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-renovate-abroad', 'renovate-abroad', 'Renovate from abroad', 'Scope, budget, and renovation control', 30, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-lagos-compliance', 'lagos-compliance', 'Lagos permits', 'Approvals, inspections, and compliance', 40, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-guides', 'guides', 'Guides & deep reads', 'Long-form playbooks under /guides', 50, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-articles', 'articles', 'Articles', 'Published reads from the BuildMyHouse desk', 60, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-tools', 'tools', 'Planning tools', 'Interactive calculators and planners', 70, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-downloads', 'downloads', 'Free downloads', 'Checklists and worksheets (PDF)', 80, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-diaspora-country', 'diaspora-country', 'By diaspora country', 'UK, USA/Canada, UAE, and regional hubs', 90, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-trust', 'trust', 'Contractors & trust', 'Vetting, updates, and accountability', 100, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sec-product', 'product', 'See the product', 'Demos and how tracking works', 110, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
