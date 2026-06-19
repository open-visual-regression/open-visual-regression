DROP INDEX "baselines_project_browser_viewport_target_uidx";--> statement-breakpoint
ALTER TABLE "baselines" ALTER COLUMN "viewport_height" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "baselines" ALTER COLUMN "viewport_height" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "viewport_height" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "viewport_height" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "baselines_project_browser_viewport_target_uidx" ON "baselines" USING btree ("project_id","browser","viewport_width","viewport_height","target_id");