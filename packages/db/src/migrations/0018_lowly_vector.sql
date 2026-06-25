ALTER TABLE "builds" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "status" SET DEFAULT 'queued'::text;--> statement-breakpoint
UPDATE "builds" SET "status" = 'queued' WHERE "status" = 'pending';--> statement-breakpoint
DROP TYPE "public"."build_status";--> statement-breakpoint
CREATE TYPE "public"."build_status" AS ENUM('queued', 'processing', 'needs_review', 'passed', 'rejected', 'error');--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "status" SET DEFAULT 'queued'::"public"."build_status";--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "status" SET DATA TYPE "public"."build_status" USING "status"::"public"."build_status";--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DEFAULT 'queued'::text;--> statement-breakpoint
UPDATE "snapshots" SET "status" = 'queued' WHERE "status" = 'pending';--> statement-breakpoint
DROP TYPE "public"."snapshot_status";--> statement-breakpoint
CREATE TYPE "public"."snapshot_status" AS ENUM('queued', 'processing', 'captured', 'error');--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DEFAULT 'queued'::"public"."snapshot_status";--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DATA TYPE "public"."snapshot_status" USING "status"::"public"."snapshot_status";