UPDATE "professional_listings" SET "email" = NULL, "normalizedEmail" = NULL WHERE "email" IS NOT NULL AND btrim("email") = '';
UPDATE "professional_listings" SET "phone" = NULL, "normalizedPhone" = NULL WHERE "phone" IS NOT NULL AND btrim("phone") = '';
UPDATE "professional_listings" SET "whatsapp" = NULL WHERE "whatsapp" IS NOT NULL AND btrim("whatsapp") = '';
UPDATE "professional_listings" SET "website" = NULL, "websiteDomain" = NULL WHERE "website" IS NOT NULL AND btrim("website") = '';
