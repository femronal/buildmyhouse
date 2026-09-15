-- CreateTable
CREATE TABLE "waitlists" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "pagePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_key_key" ON "waitlists"("key");

-- CreateIndex
CREATE INDEX "waitlists_purpose_idx" ON "waitlists"("purpose");

-- CreateIndex
CREATE INDEX "waitlists_isActive_idx" ON "waitlists"("isActive");

-- AlterTable
ALTER TABLE "waitlist_signups" ADD COLUMN "waitlistId" TEXT;

-- CreateIndex
CREATE INDEX "waitlist_signups_waitlistId_idx" ON "waitlist_signups"("waitlistId");

-- AddForeignKey
ALTER TABLE "waitlist_signups" ADD CONSTRAINT "waitlist_signups_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the existing Land Verification Checker waitlist and attach current signups.
INSERT INTO "waitlists" ("id", "key", "name", "purpose", "description", "pagePath", "isActive", "createdAt", "updatedAt")
VALUES (
    'waitlist-land-verification-checker',
    'land-verification-checker',
    'Land Verification Checker',
    'tool',
    'Email capture for the upcoming Land Verification Checker.',
    '/land-verification-in-nigeria-guide',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

UPDATE "waitlist_signups"
SET "waitlistId" = 'waitlist-land-verification-checker'
WHERE "productKey" = 'land-verification-checker';
