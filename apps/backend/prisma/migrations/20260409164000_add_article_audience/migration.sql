-- Add audience segmentation for homeowner vs GC article streams
DO $$ BEGIN
    CREATE TYPE "ArticleAudience" AS ENUM ('homeowner', 'gc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "cms_articles"
  ADD COLUMN IF NOT EXISTS "audience" "ArticleAudience" NOT NULL DEFAULT 'homeowner';

CREATE INDEX IF NOT EXISTS "cms_articles_audience_isPublished_publishedAt_idx"
  ON "cms_articles" ("audience", "isPublished", "publishedAt", "updatedAt");
