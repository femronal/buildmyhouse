ALTER TABLE "project_requests"
ADD COLUMN "monitoringFeeAmount" DOUBLE PRECISION,
ADD COLUMN "coordinationFeeAmount" DOUBLE PRECISION,
ADD COLUMN "contingencyFeeAmount" DOUBLE PRECISION,
ADD COLUMN "totalQuoteAmount" DOUBLE PRECISION,
ADD COLUMN "quoteGeneratedAt" TIMESTAMP(3);
