ALTER TABLE "capture_configurations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "capture_configurations" CASCADE;--> statement-breakpoint
DROP INDEX "baselines_project_capture_configuration_target_uidx";--> statement-breakpoint
ALTER TABLE "baselines" DROP COLUMN "capture_configuration_id";--> statement-breakpoint
ALTER TABLE "snapshots" DROP COLUMN "capture_configuration_id";
