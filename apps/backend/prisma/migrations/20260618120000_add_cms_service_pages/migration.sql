-- CreateEnum
CREATE TYPE "ServicePageRegion" AS ENUM ('lagos', 'nigeria');

-- CreateTable
CREATE TABLE "cms_service_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" "ServicePageRegion" NOT NULL,
    "templateKind" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "canonicalPath" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_service_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_service_pages_canonicalPath_key" ON "cms_service_pages"("canonicalPath");

-- CreateIndex
CREATE UNIQUE INDEX "cms_service_pages_region_slug_key" ON "cms_service_pages"("region", "slug");

-- CreateIndex
CREATE INDEX "cms_service_pages_isPublished_publishedAt_updatedAt_idx" ON "cms_service_pages"("isPublished", "publishedAt", "updatedAt");
