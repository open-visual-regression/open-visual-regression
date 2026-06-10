CREATE TABLE "capture_configurations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"browser" varchar(50) DEFAULT 'chromium' NOT NULL,
	"viewport_width" integer DEFAULT 1280 NOT NULL,
	"viewport_height" integer DEFAULT 800 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "capture_configurations" ADD CONSTRAINT "capture_configurations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;