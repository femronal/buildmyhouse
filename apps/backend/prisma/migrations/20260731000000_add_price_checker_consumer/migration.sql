-- Stage 6 — consumer Price Checker access.
-- Additive + nullable-widening only; no data is modified or removed.

-- Anonymous free-tier requests: userId becomes optional, anonymous session recorded.
ALTER TABLE "price_research_requests" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "price_research_requests" ADD COLUMN "anonymousSessionId" TEXT;
CREATE INDEX "price_research_requests_anonymousSessionId_createdAt_idx"
  ON "price_research_requests"("anonymousSessionId", "createdAt");

-- Anonymous report ownership + secure random access token (unguessable link).
ALTER TABLE "price_reports" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "price_reports" ADD COLUMN "anonymousSessionId" TEXT;
ALTER TABLE "price_reports" ADD COLUMN "accessToken" TEXT;
CREATE UNIQUE INDEX "price_reports_accessToken_key" ON "price_reports"("accessToken");
CREATE INDEX "price_reports_anonymousSessionId_createdAt_idx"
  ON "price_reports"("anonymousSessionId", "createdAt");

-- Refresh-resilient research progress (stage + evidence counters).
ALTER TABLE "price_research_runs" ADD COLUMN "progressJson" JSONB;
