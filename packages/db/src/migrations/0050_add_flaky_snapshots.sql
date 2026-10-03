CREATE TABLE "flaky_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"browser" varchar(50) NOT NULL,
	"viewport_width" integer NOT NULL,
	"viewport_height" integer NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"sample_count" integer NOT NULL,
	"change_count" integer NOT NULL,
	"revert_count" integer NOT NULL,
	"same_commit_mismatch_count" integer NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "flaky_scanned_at" timestamp;--> statement-breakpoint
ALTER TABLE "flaky_snapshots" ADD CONSTRAINT "flaky_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "flaky_snapshots_project_browser_viewport_target_uidx" ON "flaky_snapshots" USING btree ("project_id","browser","viewport_width","viewport_height","target_id");