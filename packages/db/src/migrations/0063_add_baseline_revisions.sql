CREATE TABLE "baseline_revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"browser" varchar(50) NOT NULL,
	"viewport_width" integer NOT NULL,
	"viewport_height" integer NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"build_id" uuid NOT NULL,
	"previous_snapshot_id" uuid,
	"replaced_existing" boolean NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "base_build_id" uuid;--> statement-breakpoint
ALTER TABLE "baseline_revisions" ADD CONSTRAINT "baseline_revisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_revisions" ADD CONSTRAINT "baseline_revisions_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baseline_revisions" ADD CONSTRAINT "baseline_revisions_previous_snapshot_id_snapshots_id_fk" FOREIGN KEY ("previous_snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "baseline_revisions_project_viewport_target_createdAt_idx" ON "baseline_revisions" USING btree ("project_id","browser","viewport_width","viewport_height","target_id","created_at");--> statement-breakpoint
CREATE INDEX "baseline_revisions_buildId_idx" ON "baseline_revisions" USING btree ("build_id");--> statement-breakpoint
CREATE INDEX "baseline_revisions_previousSnapshotId_idx" ON "baseline_revisions" USING btree ("previous_snapshot_id");--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_base_build_id_builds_id_fk" FOREIGN KEY ("base_build_id") REFERENCES "public"."builds"("id") ON DELETE set null ON UPDATE no action NOT VALID;