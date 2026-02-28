-- AlterTable
ALTER TABLE "contractor_certifications"
ADD COLUMN "documentType" TEXT;

-- CreateIndex
CREATE INDEX "contractor_certifications_contractorId_documentType_idx"
ON "contractor_certifications"("contractorId", "documentType");
