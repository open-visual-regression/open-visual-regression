CREATE TYPE "public"."diff_processing_status" AS ENUM('pending', 'diffed', 'error');--> statement-breakpoint
CREATE TYPE "public"."diff_review_status" AS ENUM('not_required', 'needs_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."diff_review_vote" AS ENUM('approve', 'reject');--> statement-breakpoint
ALTER TYPE "public"."build_status" ADD VALUE 'rejected' BEFORE 'error';--> statement-breakpoint
CREATE TABLE "diff_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"diff_id" uuid NOT NULL,
	"reviewer_id" text NOT NULL,
	"vote" "diff_review_vote" NOT NULL,
	"reviewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diffs" DROP CONSTRAINT "diffs_reviewer_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "diffs" ADD COLUMN "processing_status" "diff_processing_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "diffs" ADD COLUMN "review_status" "diff_review_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "required_reviewer_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "diff_reviews" ADD CONSTRAINT "diff_reviews_diff_id_diffs_id_fk" FOREIGN KEY ("diff_id") REFERENCES "public"."diffs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diff_reviews" ADD CONSTRAINT "diff_reviews_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "diff_reviews_diffId_reviewerId_uidx" ON "diff_reviews" USING btree ("diff_id","reviewer_id");--> statement-breakpoint
ALTER TABLE "diffs" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "diffs" DROP COLUMN "reviewer_id";--> statement-breakpoint
ALTER TABLE "diffs" DROP COLUMN "reviewed_at";--> statement-breakpoint
DROP TYPE "public"."diff_status";