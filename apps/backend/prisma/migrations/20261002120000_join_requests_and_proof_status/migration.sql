-- Additive: proof answers, review status, and the join-request lead queue.

CREATE TYPE "ProofAnswer" AS ENUM ('added', 'not_have', 'not_applicable');
CREATE TYPE "ProofReviewStatus" AS ENUM ('unchecked', 'passed', 'failed');
CREATE TYPE "JoinRequestStatus" AS ENUM ('new', 'contacted', 'approved', 'declined', 'spam');

ALTER TABLE "contractor_certifications"
  ADD COLUMN "reviewStatus" "ProofReviewStatus" NOT NULL DEFAULT 'unchecked',
  ADD COLUMN "reviewedByAdminId" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE TABLE "contractor_document_answers" (
  "id" TEXT NOT NULL,
  "contractorId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "answer" "ProofAnswer" NOT NULL,
  "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contractor_document_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contractor_document_answers_contractorId_documentType_key"
  ON "contractor_document_answers"("contractorId", "documentType");

ALTER TABLE "contractor_document_answers"
  ADD CONSTRAINT "contractor_document_answers_contractorId_fkey"
  FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "join_requests" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "proofs" JSONB NOT NULL,
  "photos" TEXT,
  "tradeKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "serviceLabels" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "state" TEXT,
  "areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "name" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "termsAcknowledgedAt" TIMESTAMP(3),
  "termsVersion" TEXT,
  "source" TEXT,
  "referrer" TEXT,
  "utm" JSONB,
  "status" "JoinRequestStatus" NOT NULL DEFAULT 'new',
  "adminNotes" TEXT,
  "handledByAdminId" TEXT,
  "handledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "join_requests_reference_key" ON "join_requests"("reference");
CREATE INDEX "join_requests_status_createdAt_idx" ON "join_requests"("status", "createdAt");
CREATE INDEX "join_requests_path_createdAt_idx" ON "join_requests"("path", "createdAt");
