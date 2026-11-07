-- Partner library items stay as links. Files remain on Google Drive.

CREATE TYPE "MarketingCampaignKind" AS ENUM ('tool', 'post', 'video', 'image');

ALTER TABLE "marketing_campaigns"
  ADD COLUMN "kind" "MarketingCampaignKind" NOT NULL DEFAULT 'tool',
  ADD COLUMN "assetUrl" TEXT;
