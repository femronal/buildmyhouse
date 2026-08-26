-- CreateTable
CREATE TABLE "waitlist_signups" (
    "id" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "sourcePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlist_signups_productKey_createdAt_idx" ON "waitlist_signups"("productKey", "createdAt");

-- CreateIndex
CREATE INDEX "waitlist_signups_email_idx" ON "waitlist_signups"("email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_signups_productKey_email_key" ON "waitlist_signups"("productKey", "email");
