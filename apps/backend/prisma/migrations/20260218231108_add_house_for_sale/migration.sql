-- CreateTable
CREATE TABLE "house_for_sale" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "squareFootage" DOUBLE PRECISION NOT NULL,
    "squareMeters" DOUBLE PRECISION,
    "propertyType" TEXT,
    "yearBuilt" INTEGER,
    "condition" TEXT,
    "parking" INTEGER,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nearbyFacilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactName" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "house_for_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_for_sale_images" (
    "id" TEXT NOT NULL,
    "houseForSaleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_for_sale_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "house_for_sale_images" ADD CONSTRAINT "house_for_sale_images_houseForSaleId_fkey" FOREIGN KEY ("houseForSaleId") REFERENCES "house_for_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
