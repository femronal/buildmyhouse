-- TipTap / ProseMirror document JSON (replaces legacy blocks array)
ALTER TABLE "cms_articles" RENAME COLUMN "blocks" TO "content";
