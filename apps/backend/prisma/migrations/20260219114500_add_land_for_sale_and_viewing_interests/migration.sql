-- CreateTable
CREATE TABLE "land_for_sale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "sizeSqm" DOUBLE PRECISION NOT NULL,
    "titleDocument" TEXT,
    "zoningType" TEXT,
    "topography" TEXT,
    "roadAccess" TEXT,
    "ownershipType" TEXT,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nearbyLandmarks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactName" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_for_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_for_sale_images" (
    "id" TEXT NOT NULL,
    "landForSaleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "land_for_sale_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_viewing_interests" (
    "id" TEXT NOT NULL,
    "landForSaleId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "land_viewing_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "land_viewing_interests_landForSaleId_createdAt_idx" ON "land_viewing_interests"("landForSaleId", "createdAt");

-- CreateIndex
CREATE INDEX "land_viewing_interests_isRead_createdAt_idx" ON "land_viewing_interests"("isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "land_for_sale_images" ADD CONSTRAINT "land_for_sale_images_landForSaleId_fkey" FOREIGN KEY ("landForSaleId") REFERENCES "land_for_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_viewing_interests" ADD CONSTRAINT "land_viewing_interests_landForSaleId_fkey" FOREIGN KEY ("landForSaleId") REFERENCES "land_for_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_viewing_interests" ADD CONSTRAINT "land_viewing_interests_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
