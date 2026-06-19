ALTER TABLE "baselines" ADD COLUMN "browser" varchar(50) DEFAULT 'chromium' NOT NULL;--> statement-breakpoint
ALTER TABLE "baselines" ADD COLUMN "viewport_width" integer DEFAULT 1280 NOT NULL;--> statement-breakpoint
ALTER TABLE "baselines" ADD COLUMN "viewport_height" integer;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "browser" varchar(50) DEFAULT 'chromium' NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "viewport_width" integer DEFAULT 1280 NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "viewport_height" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "baselines_project_browser_viewport_target_uidx" ON "baselines" USING btree ("project_id","browser","viewport_width",coalesce("viewport_height", 0),"target_id");