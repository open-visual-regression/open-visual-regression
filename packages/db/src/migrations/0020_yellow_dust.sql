ALTER TABLE "builds" ALTER COLUMN "capture_mode" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "capture_mode" SET DEFAULT 'worker'::text;--> statement-breakpoint
DROP TYPE "public"."capture_mode";--> statement-breakpoint
CREATE TYPE "public"."capture_mode" AS ENUM('worker');--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "capture_mode" SET DEFAULT 'worker'::"public"."capture_mode";--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "capture_mode" SET DATA TYPE "public"."capture_mode" USING "capture_mode"::"public"."capture_mode";