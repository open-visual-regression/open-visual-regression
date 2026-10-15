ALTER TABLE "snapshots" ADD COLUMN "queued_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "completed_at" timestamp;