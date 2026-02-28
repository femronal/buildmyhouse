-- CreateTable
CREATE TABLE "rental_listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "propertyType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "annualRent" DOUBLE PRECISION NOT NULL,
    "serviceCharge" DOUBLE PRECISION NOT NULL,
    "cautionDeposit" DOUBLE PRECISION NOT NULL,
    "legalFeePercent" DOUBLE PRECISION NOT NULL,
    "agencyFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "sizeSqm" DOUBLE PRECISION NOT NULL,
    "furnishing" TEXT,
    "paymentPattern" TEXT,
    "power" TEXT,
    "water" TEXT,
    "internet" TEXT,
    "parking" TEXT,
    "security" TEXT,
    "rules" TEXT,
    "inspectionWindow" TEXT,
    "proximity" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationDocs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_listing_images" (
    "id" TEXT NOT NULL,
    "rentalListingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_listing_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rental_listing_images" ADD CONSTRAINT "rental_listing_images_rentalListingId_fkey"
FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

