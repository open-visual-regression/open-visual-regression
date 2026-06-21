ALTER TABLE "snapshots" ADD COLUMN "diff_threshold" numeric(3, 2) DEFAULT 0.05 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "diff_threshold";