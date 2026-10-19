CREATE TABLE "referral_program_settings" (
    "id" TEXT NOT NULL,
    "allowHomeownerTypedCode" BOOLEAN NOT NULL DEFAULT false,
    "linkValidityDays" INTEGER NOT NULL DEFAULT 30,
    "attributionRule" TEXT NOT NULL DEFAULT 'first_touch',
    "trackVendors" BOOLEAN NOT NULL DEFAULT false,
    "countsWhen" TEXT NOT NULL DEFAULT 'undecided',
    "payoutRules" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_program_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "referral_program_settings" (
    "id",
    "allowHomeownerTypedCode",
    "linkValidityDays",
    "attributionRule",
    "trackVendors",
    "countsWhen",
    "updatedAt"
) VALUES (
    'default',
    false,
    30,
    'first_touch',
    false,
    'undecided',
    CURRENT_TIMESTAMP
);

ALTER TABLE "vendor_profiles" ADD COLUMN "referrerId" TEXT;
CREATE INDEX "vendor_profiles_referrerId_idx" ON "vendor_profiles"("referrerId");
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
