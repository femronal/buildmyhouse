-- Remove ghost CMS rows when the corrected canonical path already exists.
DELETE FROM "cms_service_pages" AS ghost
USING "cms_service_pages" AS correct
WHERE ghost."canonicalPath" LIKE '%-nigeria-nigeria%'
  AND correct."canonicalPath" = REPLACE(ghost."canonicalPath", '-nigeria-nigeria', '-nigeria')
  AND ghost.id <> correct.id;

-- Repoint remaining doubled Nigeria paths and slugs.
UPDATE "cms_service_pages"
SET
  "canonicalPath" = REPLACE("canonicalPath", '-nigeria-nigeria', '-nigeria'),
  slug = REPLACE(slug, '-nigeria-nigeria', '-nigeria'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "canonicalPath" LIKE '%-nigeria-nigeria%'
   OR slug LIKE '%-nigeria-nigeria%';
