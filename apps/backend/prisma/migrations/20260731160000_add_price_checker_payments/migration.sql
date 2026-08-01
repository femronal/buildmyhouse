-- Stage 7 — guest Paystack payments (one-time fulfilment entitlement).
-- Additive only. Integer kobo for all money. No credit wallet.

-- Link research requests to optional payment orders.
ALTER TABLE "price_research_requests" ADD COLUMN "paymentOrderId" TEXT;

-- Immutable server-side quotes
CREATE TABLE "price_check_payment_quotes" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "anonymousSessionId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "requestedItemCount" INTEGER NOT NULL,
    "freeItemCountApplied" INTEGER NOT NULL,
    "chargeableItemCount" INTEGER NOT NULL,
    "unitPriceKobo" INTEGER NOT NULL,
    "subtotalKobo" INTEGER NOT NULL,
    "discountKobo" INTEGER NOT NULL DEFAULT 0,
    "totalKobo" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "pricingVersion" TEXT NOT NULL,
    "itemsJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_check_payment_quotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_check_payment_quotes_sessionId_createdAt_idx"
  ON "price_check_payment_quotes"("sessionId", "createdAt");
CREATE INDEX "price_check_payment_quotes_anonymousSessionId_createdAt_idx"
  ON "price_check_payment_quotes"("anonymousSessionId", "createdAt");
CREATE INDEX "price_check_payment_quotes_status_expiresAt_idx"
  ON "price_check_payment_quotes"("status", "expiresAt");

-- Payment orders (one-time entitlement after success)
CREATE TABLE "price_check_payment_orders" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "anonymousSessionId" TEXT,
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paystack',
    "providerReference" TEXT NOT NULL,
    "providerAccessCode" TEXT,
    "providerTransactionId" TEXT,
    "amountExpectedKobo" INTEGER NOT NULL,
    "amountPaidKobo" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'initialized',
    "fulfilmentStatus" TEXT NOT NULL DEFAULT 'not_started',
    "initializedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAmountKobo" INTEGER NOT NULL DEFAULT 0,
    "entitlementExpiresAt" TIMESTAMP(3),
    "recoveryTokenHash" TEXT,
    "recoveryTokenExpiresAt" TIMESTAMP(3),
    "metadataSafe" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_check_payment_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_check_payment_orders_providerReference_key"
  ON "price_check_payment_orders"("providerReference");
CREATE UNIQUE INDEX "price_check_payment_orders_recoveryTokenHash_key"
  ON "price_check_payment_orders"("recoveryTokenHash");
CREATE INDEX "price_check_payment_orders_quoteId_idx"
  ON "price_check_payment_orders"("quoteId");
CREATE INDEX "price_check_payment_orders_sessionId_createdAt_idx"
  ON "price_check_payment_orders"("sessionId", "createdAt");
CREATE INDEX "price_check_payment_orders_anonymousSessionId_createdAt_idx"
  ON "price_check_payment_orders"("anonymousSessionId", "createdAt");
CREATE INDEX "price_check_payment_orders_status_fulfilmentStatus_idx"
  ON "price_check_payment_orders"("status", "fulfilmentStatus");
CREATE INDEX "price_check_payment_orders_customerEmail_idx"
  ON "price_check_payment_orders"("customerEmail");

ALTER TABLE "price_check_payment_orders"
  ADD CONSTRAINT "price_check_payment_orders_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "price_check_payment_quotes"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Line items (one report outcome per paid/free line)
CREATE TABLE "price_check_payment_line_items" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "clientItemKey" TEXT NOT NULL,
    "familyKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "productLabel" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "rawProductName" TEXT NOT NULL,
    "answersJson" JSONB NOT NULL,
    "free" BOOLEAN NOT NULL DEFAULT false,
    "amountKobo" INTEGER NOT NULL,
    "researchRequestId" TEXT,
    "reportId" TEXT,
    "fulfilmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "technicalFailureReason" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_check_payment_line_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_check_payment_line_items_paymentOrderId_clientItemKey_key"
  ON "price_check_payment_line_items"("paymentOrderId", "clientItemKey");
CREATE INDEX "price_check_payment_line_items_paymentOrderId_fulfilmentStatus_idx"
  ON "price_check_payment_line_items"("paymentOrderId", "fulfilmentStatus");
CREATE INDEX "price_check_payment_line_items_reportId_idx"
  ON "price_check_payment_line_items"("reportId");

ALTER TABLE "price_check_payment_line_items"
  ADD CONSTRAINT "price_check_payment_line_items_paymentOrderId_fkey"
  FOREIGN KEY ("paymentOrderId") REFERENCES "price_check_payment_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Provider events (idempotent)
CREATE TABLE "price_check_payment_events" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT,
    "providerEventType" TEXT NOT NULL,
    "eventFingerprint" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "safePayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "price_check_payment_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_check_payment_events_eventFingerprint_key"
  ON "price_check_payment_events"("eventFingerprint");
CREATE INDEX "price_check_payment_events_paymentOrderId_receivedAt_idx"
  ON "price_check_payment_events"("paymentOrderId", "receivedAt");

ALTER TABLE "price_check_payment_events"
  ADD CONSTRAINT "price_check_payment_events_paymentOrderId_fkey"
  FOREIGN KEY ("paymentOrderId") REFERENCES "price_check_payment_orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Refunds
CREATE TABLE "price_check_refunds" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "lineItemId" TEXT,
    "providerRefundId" TEXT,
    "amountKobo" INTEGER NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_check_refunds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_check_refunds_paymentOrderId_idx"
  ON "price_check_refunds"("paymentOrderId");
CREATE INDEX "price_check_refunds_status_idx"
  ON "price_check_refunds"("status");

ALTER TABLE "price_check_refunds"
  ADD CONSTRAINT "price_check_refunds_paymentOrderId_fkey"
  FOREIGN KEY ("paymentOrderId") REFERENCES "price_check_payment_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Unit economics
CREATE TABLE "price_check_unit_economics" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "reportId" TEXT,
    "grossRevenueKobo" INTEGER NOT NULL,
    "paymentFeeKobo" INTEGER,
    "researchCostUsdMicros" INTEGER,
    "searchCostKobo" INTEGER NOT NULL DEFAULT 0,
    "aiCostKobo" INTEGER NOT NULL DEFAULT 0,
    "extractionCostKobo" INTEGER NOT NULL DEFAULT 0,
    "pdfCostKobo" INTEGER NOT NULL DEFAULT 0,
    "storageCostKobo" INTEGER NOT NULL DEFAULT 0,
    "refundCostKobo" INTEGER NOT NULL DEFAULT 0,
    "totalVariableCostKobo" INTEGER NOT NULL,
    "netRevenueKobo" INTEGER NOT NULL,
    "grossMarginKobo" INTEGER NOT NULL,
    "grossMarginBps" INTEGER NOT NULL,
    "costDataComplete" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_check_unit_economics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_check_unit_economics_lineItemId_key"
  ON "price_check_unit_economics"("lineItemId");
CREATE INDEX "price_check_unit_economics_paymentOrderId_idx"
  ON "price_check_unit_economics"("paymentOrderId");
CREATE INDEX "price_check_unit_economics_calculatedAt_idx"
  ON "price_check_unit_economics"("calculatedAt");

ALTER TABLE "price_check_unit_economics"
  ADD CONSTRAINT "price_check_unit_economics_paymentOrderId_fkey"
  FOREIGN KEY ("paymentOrderId") REFERENCES "price_check_payment_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_check_unit_economics"
  ADD CONSTRAINT "price_check_unit_economics_lineItemId_fkey"
  FOREIGN KEY ("lineItemId") REFERENCES "price_check_payment_line_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Research request → payment order FK (after orders table exists)
CREATE INDEX "price_research_requests_paymentOrderId_idx"
  ON "price_research_requests"("paymentOrderId");
ALTER TABLE "price_research_requests"
  ADD CONSTRAINT "price_research_requests_paymentOrderId_fkey"
  FOREIGN KEY ("paymentOrderId") REFERENCES "price_check_payment_orders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
