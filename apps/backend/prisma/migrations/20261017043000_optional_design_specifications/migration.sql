-- Leave existing plan numbers in place. New and edited plans may omit these fields.
ALTER TABLE "designs" ALTER COLUMN "bedrooms" DROP NOT NULL;
ALTER TABLE "designs" ALTER COLUMN "bathrooms" DROP NOT NULL;
ALTER TABLE "designs" ALTER COLUMN "squareFootage" DROP NOT NULL;
