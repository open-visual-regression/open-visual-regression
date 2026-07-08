CREATE TYPE "public"."git_publication_outcome" AS ENUM('ok', 'error');--> statement-breakpoint
CREATE TYPE "public"."git_status_state" AS ENUM('pending', 'success', 'failure', 'error');--> statement-breakpoint
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
ALTER TABLE "git_status_publications" ADD CONSTRAINT "git_status_publications_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "git_status_publications_buildId_createdAt_idx" ON "git_status_publications" USING btree ("build_id","created_at");