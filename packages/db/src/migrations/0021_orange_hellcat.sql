ALTER TABLE "builds" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "diffs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;