CREATE TYPE "public"."build_processing_status" AS ENUM('queued', 'processing', 'processed', 'error');--> statement-breakpoint
CREATE TYPE "public"."build_review_status" AS ENUM('not_required', 'needs_review', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "processing_status" "build_processing_status" DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "review_status" "build_review_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "builds" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."build_status";