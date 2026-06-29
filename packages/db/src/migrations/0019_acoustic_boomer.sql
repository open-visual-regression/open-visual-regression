CREATE TYPE "public"."build_processing_status" AS ENUM('queued', 'processing', 'success', 'error');--> statement-breakpoint
CREATE TYPE "public"."build_review_status" AS ENUM('not_required', 'needs_review', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "diffs" ALTER COLUMN "processing_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "diffs" ALTER COLUMN "processing_status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."diff_processing_status";--> statement-breakpoint
CREATE TYPE "public"."diff_processing_status" AS ENUM('pending', 'success', 'error');--> statement-breakpoint
ALTER TABLE "diffs" ALTER COLUMN "processing_status" SET DEFAULT 'pending'::"public"."diff_processing_status";--> statement-breakpoint
UPDATE "diffs" SET "processing_status" = 'success' WHERE "processing_status" = 'diffed';--> statement-breakpoint
ALTER TABLE "diffs" ALTER COLUMN "processing_status" SET DATA TYPE "public"."diff_processing_status" USING "processing_status"::"public"."diff_processing_status";--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DEFAULT 'queued'::text;--> statement-breakpoint
DROP TYPE "public"."snapshot_status";--> statement-breakpoint
CREATE TYPE "public"."snapshot_status" AS ENUM('queued', 'processing', 'success', 'error');--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DEFAULT 'queued'::"public"."snapshot_status";--> statement-breakpoint
UPDATE "snapshots" SET "status" = 'success' WHERE "status" = 'captured';--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "status" SET DATA TYPE "public"."snapshot_status" USING "status"::"public"."snapshot_status";--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "processing_status" "build_processing_status" DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "review_status" "build_review_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "builds" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."build_status";