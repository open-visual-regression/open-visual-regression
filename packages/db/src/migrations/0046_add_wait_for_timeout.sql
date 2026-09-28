ALTER TABLE "build_extract_defaults" ADD COLUMN "wait_for_timeout" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "wait_for_timeout" integer DEFAULT 0 NOT NULL;