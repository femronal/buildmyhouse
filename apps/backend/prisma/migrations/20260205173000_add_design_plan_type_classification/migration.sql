-- Add persisted design plan classification for GC-uploaded plans.
ALTER TABLE "designs"
ADD COLUMN "planType" "ProjectType" NOT NULL DEFAULT 'homebuilding';
