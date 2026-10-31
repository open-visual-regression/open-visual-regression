CREATE TYPE "public"."screenshot_stability" AS ENUM('auto', 'always', 'off');--> statement-breakpoint
ALTER TABLE "build_extract_defaults" ADD COLUMN "screenshot_stability" "screenshot_stability" DEFAULT 'auto' NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "screenshot_stability" "screenshot_stability" DEFAULT 'auto' NOT NULL;