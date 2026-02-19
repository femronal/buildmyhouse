-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('homebuilding', 'renovation', 'interior_design');

-- CreateEnum
CREATE TYPE "ProjectReviewStatus" AS ENUM ('pending_admin_review', 'changes_requested', 'approved');

-- CreateEnum
CREATE TYPE "PaymentConfirmationStatus" AS ENUM ('not_declared', 'declared', 'confirmed', 'rejected');

-- AlterTable
ALTER TABLE "projects"
ADD COLUMN     "projectType" "ProjectType",
ADD COLUMN     "reviewStatus" "ProjectReviewStatus",
ADD COLUMN     "externalPaymentLink" TEXT,
ADD COLUMN     "paymentDeclaredAt" TIMESTAMP(3),
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "paymentConfirmationStatus" "PaymentConfirmationStatus" NOT NULL DEFAULT 'not_declared';

-- AlterTable
ALTER TABLE "contractors" ADD COLUMN     "connectAccountId" TEXT;

