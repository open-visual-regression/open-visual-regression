CREATE TYPE "public"."build_status" AS ENUM('pending', 'needs_review', 'passed', 'error');--> statement-breakpoint
CREATE TYPE "public"."capture_mode" AS ENUM('worker', 'pre_captured');--> statement-breakpoint
CREATE TYPE "public"."diff_status" AS ENUM('pending', 'auto_approved', 'needs_review', 'approved', 'rejected', 'error');--> statement-breakpoint
CREATE TYPE "public"."snapshot_status" AS ENUM('pending', 'captured', 'error');--> statement-breakpoint
CREATE TABLE "baselines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"capture_configuration_id" uuid NOT NULL,
	"story_id" varchar(255) NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"approved_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"branch" varchar(255) NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"status" "build_status" DEFAULT 'pending' NOT NULL,
	"capture_mode" "capture_mode" DEFAULT 'worker' NOT NULL,
	"storybook_path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diffs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"baseline_snapshot_id" uuid,
	"status" "diff_status" DEFAULT 'pending' NOT NULL,
	"diff_image_path" text,
	"pixel_diff_count" integer,
	"diff_percent" real,
	"reviewer_id" text,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "snapshot_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"level" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"build_id" uuid NOT NULL,
	"capture_configuration_id" uuid NOT NULL,
	"story_id" varchar(255) NOT NULL,
	"status" "snapshot_status" DEFAULT 'pending' NOT NULL,
	"image_path" text,
	"has_render_error" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_capture_configuration_id_capture_configurations_id_fk" FOREIGN KEY ("capture_configuration_id") REFERENCES "public"."capture_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_baseline_snapshot_id_snapshots_id_fk" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshot_logs" ADD CONSTRAINT "snapshot_logs_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_capture_configuration_id_capture_configurations_id_fk" FOREIGN KEY ("capture_configuration_id") REFERENCES "public"."capture_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "baselines_project_capture_configuration_story_uidx" ON "baselines" USING btree ("project_id","capture_configuration_id","story_id");