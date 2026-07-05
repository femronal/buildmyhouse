-- CreateEnum
CREATE TYPE "ProjectAccessRole" AS ENUM ('homeowner', 'general_contractor');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "managedParticipant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "accessClaimedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "managedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "project_access_links" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" "ProjectAccessRole" NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "participantUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "verificationCodeHash" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    "termsAcceptedAt" TIMESTAMP(3),
    "claimedUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_access_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL DEFAULT 'renovation',
    "description" TEXT,
    "defaultBudget" DOUBLE PRECISION,
    "stages" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_access_links_tokenHash_key" ON "project_access_links"("tokenHash");
CREATE INDEX "project_access_links_projectId_role_idx" ON "project_access_links"("projectId", "role");
CREATE INDEX "project_access_links_contactEmail_idx" ON "project_access_links"("contactEmail");
CREATE UNIQUE INDEX "project_templates_slug_key" ON "project_templates"("slug");

-- AddForeignKey
ALTER TABLE "project_access_links" ADD CONSTRAINT "project_access_links_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_access_links" ADD CONSTRAINT "project_access_links_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_access_links" ADD CONSTRAINT "project_access_links_claimedUserId_fkey" FOREIGN KEY ("claimedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
