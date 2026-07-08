CREATE TYPE "public"."git_provider" AS ENUM('github', 'gitea');--> statement-breakpoint
CREATE TABLE "git_integrations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"provider" "git_provider" NOT NULL,
	"base_url" text,
	"repo_identifier" varchar(512) NOT NULL,
	"encrypted_token" text NOT NULL,
	"check_context" varchar(255) DEFAULT 'ovr/visual-review' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "git_integrations" ADD CONSTRAINT "git_integrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "git_integrations_projectId_uidx" ON "git_integrations" USING btree ("project_id");