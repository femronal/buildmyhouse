ALTER TABLE "referrers" ADD COLUMN "leaderboardNickname" TEXT;
ALTER TABLE "referrers" ADD COLUMN "leaderboardHidden" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "referrers_leaderboardNickname_key" ON "referrers"("leaderboardNickname");

ALTER TABLE "referral_program_settings" ADD COLUMN "leaderboardShowRealNames" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "referral_clicks" ADD COLUMN "channel" TEXT;
CREATE INDEX "referral_clicks_referrerId_channel_idx" ON "referral_clicks"("referrerId", "channel");

ALTER TABLE "customer_attributions" ADD COLUMN "channel" TEXT;

ALTER TABLE "marketing_campaigns" ADD COLUMN "placement" TEXT;
