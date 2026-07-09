ALTER TYPE "public"."build_review_status" RENAME TO "build_review_status_old";--> statement-breakpoint
CREATE TYPE "public"."build_review_status" AS ENUM('not_required', 'unchanged', 'auto_approved', 'needs_review', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "review_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "review_status" TYPE "public"."build_review_status" USING "review_status"::text::"public"."build_review_status";--> statement-breakpoint
ALTER TABLE "builds" ALTER COLUMN "review_status" SET DEFAULT 'not_required';--> statement-breakpoint
DROP TYPE "public"."build_review_status_old";
