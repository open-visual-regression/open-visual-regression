CREATE TYPE "public"."git_provider" AS ENUM('github', 'github_enterprise', 'gitea', 'forgejo', 'gitlab');--> statement-breakpoint
CREATE TYPE "public"."git_publication_outcome" AS ENUM('ok', 'error');--> statement-breakpoint
CREATE TYPE "public"."git_status_state" AS ENUM('pending', 'success', 'failure', 'error');--> statement-breakpoint
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
CREATE TABLE "git_status_publications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"build_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"context" varchar(255) NOT NULL,
	"state" "git_status_state" NOT NULL,
	"outcome" "git_publication_outcome" NOT NULL,
	"http_status" integer,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "git_integrations" ADD CONSTRAINT "git_integrations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "git_status_publications" ADD CONSTRAINT "git_status_publications_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "git_integrations_projectId_uidx" ON "git_integrations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "git_status_publications_buildId_createdAt_idx" ON "git_status_publications" USING btree ("build_id","created_at");