-- CreateEnum
CREATE TYPE "ProjectRiskLevel" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "designs" ALTER COLUMN "features" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "materials" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "rooms" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "riskLevel" "ProjectRiskLevel" NOT NULL DEFAULT 'low';
