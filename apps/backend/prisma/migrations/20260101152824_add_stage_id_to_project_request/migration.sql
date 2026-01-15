-- AlterTable
ALTER TABLE "project_requests" ADD COLUMN     "stageId" TEXT;

-- AddForeignKey
ALTER TABLE "project_requests" ADD CONSTRAINT "project_requests_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
