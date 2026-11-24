DROP INDEX IF EXISTS "referral_clicks_referrerId_channel_idx";
ALTER TABLE "referral_clicks" DROP COLUMN IF EXISTS "channel";
ALTER TABLE "customer_attributions" DROP COLUMN IF EXISTS "channel";

CREATE TABLE "partner_activity_days" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "logins" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_activity_days_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "partner_activity_days_referrerId_day_key" ON "partner_activity_days"("referrerId", "day");
CREATE INDEX "partner_activity_days_referrerId_day_idx" ON "partner_activity_days"("referrerId", "day");
ALTER TABLE "partner_activity_days" ADD CONSTRAINT "partner_activity_days_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "partner_skit_ideas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "whoFilms" TEXT,
    "format" TEXT NOT NULL DEFAULT 'skit',
    "script" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "partner_skit_ideas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "partner_skit_ideas_slug_key" ON "partner_skit_ideas"("slug");
CREATE INDEX "partner_skit_ideas_status_sortOrder_idx" ON "partner_skit_ideas"("status", "sortOrder");

CREATE TABLE "bmh_posts" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "postedAt" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bmh_posts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bmh_posts_url_key" ON "bmh_posts"("url");
CREATE INDEX "bmh_posts_status_postedAt_idx" ON "bmh_posts"("status", "postedAt");

INSERT INTO "partner_activity_days" ("id","referrerId","day","logins","visits","firstSeenAt","lastSeenAt") SELECT gen_random_uuid()::text, "referrerId", to_char("usedAt" + interval '1 hour', 'YYYY-MM-DD'), count(*), 0, min("usedAt"), max("usedAt") FROM "partner_login_tokens" WHERE "usedAt" IS NOT NULL GROUP BY "referrerId", to_char("usedAt" + interval '1 hour', 'YYYY-MM-DD') ON CONFLICT ("referrerId","day") DO NOTHING;

INSERT INTO "partner_skit_ideas" ("id","slug","sortOrder","title","whoFilms","format","script","caption","status","source","createdAt","updatedAt") VALUES
  (gen_random_uuid()::text, 'almost-done', 1, $q$"Almost done"$q$, $q$partner abroad$q$, 'skit', $q$HOOK (to camera, tired): "Two years of monthly transfers, and it's still at foundation level."
SCENE: You're on a phone call, pacing, and we only hear your side. "Every month I send. Every month it's 'almost done'. Almost done what? Nobody ever told me what done means." Hang up and sit down.
THE TURN (last 5 seconds, to camera): "My mistake was paying on someone's word. Now I agree what each stage is, and I approve it before any money moves. Link in my bio."$q$, $q$Skit, but tell me you haven't heard "almost done" before. Two years, still at foundation. What's the longest "almost done" you've been told? #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00'),
  (gen_random_uuid()::text, 'angry-voice-note', 2, $q$The angry voice note$q$, $q$partner in Nigeria$q$, 'skit', $q$HOOK (to camera, calm): "He's shouting because his money is gone. I'm calm because I've heard this story before."
SCENE: Play a voice note, shown as on-screen text with a voice-note sound: "You told me the roof was done! My uncle went there today. There is no roof!" You answer gently: "Sir, I hear you. Sending money and getting only a picture back is exactly how this happens."
THE TURN (last 5 seconds): "Next time, don't pay for a stage until someone you chose has seen it finished and you've approved it. That's how I work now. Link in my bio."$q$, $q$Dramatised, but some of you are living this right now. A picture of a roof is not a roof. #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00'),
  (gen_random_uuid()::text, 'who-will-replace-the-money', 3, $q$"Who will replace the money?"$q$, $q$one actor, two roles$q$, 'skit', $q$HOOK (text on screen): "Ask where the money went, and suddenly you're the one disgracing the family."
SCENE: You play both roles, switching with a headwrap.
- Role 1, on the phone: "I only asked for the receipt."
- Role 2, as the auntie: "Why would you disgrace your cousin over money?"
- Role 1: "Then who will replace the money?"
- Cut to silence, then the auntie looks away.
THE TURN (last 5 seconds, as yourself): "Asking isn't an insult. Set it up before the money moves, so nobody has to be asked afterwards. Agree each stage, and approve it before you pay. Link in bio."$q$, $q$Skit. No family was disgraced in the making of this video. But who did answer that question in your family? #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00'),
  (gen_random_uuid()::text, 'cement-will-go-up-tomorrow', 4, $q$"Cement will go up tomorrow"$q$, $q$either location$q$, 'skit', $q$HOOK (reading your phone): "'Send everything today, cement price will go up tomorrow.' Who else has received this message?"
SCENE: Read on: "The price went up again. Send it all now." Look up: "So I sent it all. Three months later the bags were sitting in the rain, and half of them were gone."
THE TURN (last 5 seconds): "Buy only what the stage you're on needs, pay the supplier directly, and approve each stage before you pay for the next one. Link in bio."$q$, $q$Dramatised. The panic is real, and so is the cement sitting in the rain. #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00'),
  (gen_random_uuid()::text, 'the-gate', 5, $q$"The gate"$q$, $q$partner abroad$q$, 'skit', $q$HOOK (to camera): "Everybody in the village admires my gate. Nobody knows there's no roof behind it."
SCENE: Show a phone photo of a gate (any stock gate, not a real person's house). "I built the gate first so people would see something. Then the money ran out at lintel level."
THE TURN (last 5 seconds): "Build for yourself, not for the people admiring the gate. Build one stage at a time, and approve each one before you pay. Link in bio."$q$, $q$Skit. Building a future and building a reputation are not the same project. #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00'),
  (gen_random_uuid()::text, 'rate-my-builders-excuse', 6, $q$"Rate my builder's excuse"$q$, NULL, 'alternative', $q$HOOK (to camera, holding a card): "Rate this builder's excuse from 1 to 10."
SCENE: Read it slowly. "The work turned out bigger than we planned. I need extra money to finish." Pause. "I'll give it a 9, because it works every single time."
THE TURN (last 5 seconds): "That excuse only works when nobody agreed what each stage costs. Agree it first, and approve each stage before you pay. Link in bio. Now put your score in the comments, along with the worst excuse you've heard."
Easy repeat: a new excuse each week.$q$, $q$Skit. Rate it 1 to 10, then give me the worst builder's excuse you've ever heard. #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00'),
  (gen_random_uuid()::text, 'tundes-house-in-ibadan', 7, $q$"Tunde's house in Ibadan, episode 1 of 5"$q$, NULL, 'alternative', $q$On-screen label: "Dramatised series. Tunde is not a real person."
HOOK (to camera): "This is Tunde. He lives in Manchester, and he's building a three-bedroom bungalow in Ibadan. Episode 1 of 5."
SCENE (narrated by you, with a few phone photos of a plot or blocks): "A man from church recommended a builder. Tunde sent ₦4 million for the foundation. He got a nice picture back and sent the next payment. Then his neighbour in Ibadan sent him a video of the plot."
CLIFFHANGER: "What was in that video made Tunde book a flight that same night. Episode 2 tomorrow."
THE TURN (last 5 seconds): "In episode 5, I'll show you what Tunde does differently the second time. Follow so you don't miss it. Link in bio."$q$, $q$Episode 1 of 5. Tunde is fictional, but this story isn't rare. Guess what was in the video. #ad BuildMyHouse partner [your link]$q$, 'active', '2026-11-20-thespian-skit-templates.md', TIMESTAMP '2026-11-20 00:00:00', TIMESTAMP '2026-11-20 00:00:00')
ON CONFLICT ("slug") DO NOTHING;
