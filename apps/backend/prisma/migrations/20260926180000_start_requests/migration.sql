CREATE TABLE "start_requests" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "source" TEXT,
    "referrer" TEXT,
    "utm" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "start_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "start_requests_reference_key" ON "start_requests"("reference");
CREATE INDEX "start_requests_createdAt_idx" ON "start_requests"("createdAt");
