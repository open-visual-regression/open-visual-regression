ALTER TABLE "snapshots" ADD COLUMN "render_error_message" text;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "has_uncaught_page_error" boolean DEFAULT false NOT NULL;