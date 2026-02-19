-- CreateTable
CREATE TABLE "contractor_certifications" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "expiryYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contractor_certifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contractor_certifications" ADD CONSTRAINT "contractor_certifications_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
