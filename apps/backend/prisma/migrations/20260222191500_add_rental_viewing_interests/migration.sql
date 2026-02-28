-- CreateTable
CREATE TABLE "rental_viewing_interests" (
    "id" TEXT NOT NULL,
    "rentalListingId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "outcomeStatus" TEXT NOT NULL DEFAULT 'abandoned',
    "purchaseAmount" DOUBLE PRECISION,
    "purchaseMarkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_viewing_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_viewing_interests_rentalListingId_createdAt_idx"
ON "rental_viewing_interests"("rentalListingId", "createdAt");

-- CreateIndex
CREATE INDEX "rental_viewing_interests_isRead_createdAt_idx"
ON "rental_viewing_interests"("isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "rental_viewing_interests" ADD CONSTRAINT "rental_viewing_interests_rentalListingId_fkey"
FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_viewing_interests" ADD CONSTRAINT "rental_viewing_interests_homeownerId_fkey"
FOREIGN KEY ("homeownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

