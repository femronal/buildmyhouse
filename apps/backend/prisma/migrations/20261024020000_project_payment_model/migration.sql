CREATE TYPE "ProjectPaymentModel" AS ENUM ('pay_in_full', 'pay_by_stage');

ALTER TABLE "projects" ADD COLUMN "paymentModel" "ProjectPaymentModel";

ALTER TABLE "stages" ADD COLUMN "depositDue" DOUBLE PRECISION;
