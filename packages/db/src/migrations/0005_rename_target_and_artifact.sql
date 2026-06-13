ALTER TABLE "snapshots" RENAME COLUMN "story_id" TO "target_id";
--> statement-breakpoint
ALTER TABLE "baselines" RENAME COLUMN "story_id" TO "target_id";
--> statement-breakpoint
ALTER TABLE "builds" RENAME COLUMN "storybook_path" TO "artifact_path";
--> statement-breakpoint
ALTER INDEX "baselines_project_capture_configuration_story_uidx" RENAME TO "baselines_project_capture_configuration_target_uidx";
