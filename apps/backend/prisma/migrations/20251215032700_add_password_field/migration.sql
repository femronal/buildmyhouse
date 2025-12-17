-- Add password column as nullable first
ALTER TABLE "users" ADD COLUMN "password" TEXT;

-- Set a default password for existing users (hashed "temp123")
-- Users should change this password after first login
UPDATE "users" SET "password" = '$2b$10$PIzLBpdhtPbZ6gCnhT7OXe5xn.Y604IGzayL0zP.318fB046MJgVy' WHERE "password" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;
