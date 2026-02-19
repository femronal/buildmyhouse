-- CreateTable
CREATE TABLE "house_viewing_interests" (
    "id" TEXT NOT NULL,
    "houseForSaleId" TEXT NOT NULL,
    "homeownerId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_viewing_interests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "house_viewing_interests_houseForSaleId_createdAt_idx" ON "house_viewing_interests"("houseForSaleId", "createdAt");

-- CreateIndex
CREATE INDEX "house_viewing_interests_isRead_createdAt_idx" ON "house_viewing_interests"("isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "house_viewing_interests" ADD CONSTRAINT "house_viewing_interests_houseForSaleId_fkey" FOREIGN KEY ("houseForSaleId") REFERENCES "house_for_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_viewing_interests" ADD CONSTRAINT "house_viewing_interests_homeownerId_fkey" FOREIGN KEY ("homeownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
