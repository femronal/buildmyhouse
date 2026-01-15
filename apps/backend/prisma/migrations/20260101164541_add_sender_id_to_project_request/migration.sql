-- AlterTable
ALTER TABLE "project_requests" ADD COLUMN     "senderId" TEXT;

-- AddForeignKey
ALTER TABLE "project_requests" ADD CONSTRAINT "project_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
