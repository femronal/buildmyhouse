-- CreateEnum
CREATE TYPE "ReferrerType" AS ENUM ('referrer', 'affiliate');

-- CreateTable
CREATE TABLE "referrers" (
    "id" TEXT NOT NULL,
    "type" "ReferrerType" NOT NULL DEFAULT 'referrer',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "userId" TEXT,
    "notes" TEXT,
    "createdByAdminId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrers_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "inviteClientPromptSeenAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "referrerId" TEXT,
ADD COLUMN "referredAt" TIMESTAMP(3),
ADD COLUMN "referralSource" TEXT;
ALTER TABLE "professional_listings" ADD COLUMN "referrerId" TEXT;
ALTER TABLE "artisan_listings" ADD COLUMN "referrerId" TEXT;
ALTER TABLE "start_requests" ADD COLUMN "referrerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "referrers_code_key" ON "referrers"("code");
CREATE UNIQUE INDEX "referrers_userId_key" ON "referrers"("userId");
CREATE INDEX "referrers_type_archivedAt_idx" ON "referrers"("type", "archivedAt");
CREATE INDEX "projects_referrerId_idx" ON "projects"("referrerId");
CREATE INDEX "professional_listings_referrerId_idx" ON "professional_listings"("referrerId");
CREATE INDEX "artisan_listings_referrerId_idx" ON "artisan_listings"("referrerId");
CREATE INDEX "start_requests_referrerId_idx" ON "start_requests"("referrerId");

-- AddForeignKey
ALTER TABLE "referrers" ADD CONSTRAINT "referrers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referrers" ADD CONSTRAINT "referrers_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "professional_listings" ADD CONSTRAINT "professional_listings_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "artisan_listings" ADD CONSTRAINT "artisan_listings_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "start_requests" ADD CONSTRAINT "start_requests_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "hr_admin_permissions" ("id", "key", "groupLabel", "description", "isCritical", "createdAt")
SELECT gen_random_uuid()::text, v.key, 'Growth', v.description, false, CURRENT_TIMESTAMP
FROM (VALUES
  ('referrals.view', 'View referrers, affiliates and the listings and jobs they brought in'),
  ('referrals.edit', 'Create and edit referrers and attach them to listings and jobs')
) AS v(key, description)
WHERE NOT EXISTS (SELECT 1 FROM "hr_admin_permissions" p WHERE p."key" = v.key);

INSERT INTO "hr_admin_role_permissions" ("id", "roleId", "permissionId")
SELECT gen_random_uuid()::text, rp."roleId", newp."id"
FROM "hr_admin_role_permissions" rp
JOIN "hr_admin_permissions" oldp ON oldp."id" = rp."permissionId" AND oldp."key" = 'artisans.view'
JOIN "hr_admin_permissions" newp ON newp."key" = 'referrals.view'
WHERE NOT EXISTS (
  SELECT 1 FROM "hr_admin_role_permissions" existing
  WHERE existing."roleId" = rp."roleId" AND existing."permissionId" = newp."id"
);

INSERT INTO "hr_admin_role_permissions" ("id", "roleId", "permissionId")
SELECT gen_random_uuid()::text, rp."roleId", newp."id"
FROM "hr_admin_role_permissions" rp
JOIN "hr_admin_permissions" oldp ON oldp."id" = rp."permissionId" AND oldp."key" = 'artisans.edit'
JOIN "hr_admin_permissions" newp ON newp."key" = 'referrals.edit'
WHERE NOT EXISTS (
  SELECT 1 FROM "hr_admin_role_permissions" existing
  WHERE existing."roleId" = rp."roleId" AND existing."permissionId" = newp."id"
);
