ALTER TYPE "public"."diff_review_status" ADD VALUE 'unchanged' BEFORE 'needs_review';--> statement-breakpoint
ALTER TYPE "public"."diff_review_status" ADD VALUE 'auto_approved' BEFORE 'needs_review';