/*
  Warnings:

  - You are about to drop the `file_attachments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `materials` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "file_attachments" DROP CONSTRAINT "file_attachments_projectId_fkey";

-- DropForeignKey
ALTER TABLE "file_attachments" DROP CONSTRAINT "file_attachments_stageId_fkey";

-- DropForeignKey
ALTER TABLE "file_attachments" DROP CONSTRAINT "file_attachments_uploadedById_fkey";

-- AlterTable
ALTER TABLE "contractors" ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "file_attachments";
