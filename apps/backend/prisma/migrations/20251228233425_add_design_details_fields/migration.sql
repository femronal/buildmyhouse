-- AlterTable
ALTER TABLE "designs" ADD COLUMN     "constructionPhases" JSONB,
ADD COLUMN     "estimatedDuration" TEXT,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "floors" INTEGER,
ADD COLUMN     "materials" TEXT[],
ADD COLUMN     "rooms" TEXT[];
