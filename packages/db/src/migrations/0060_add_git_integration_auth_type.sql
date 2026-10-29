CREATE TYPE "public"."git_auth_type" AS ENUM('access_token', 'github_app');--> statement-breakpoint
-- Only rows with auth_type 'github_app' leave encrypted_token empty, and the code that
-- writes those ships after this migration. Code from the previous release never sees one.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "git_integrations" ALTER COLUMN "encrypted_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "auth_type" "git_auth_type" DEFAULT 'access_token' NOT NULL;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "github_installation_id" bigint;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "external_repo_id" bigint;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD CONSTRAINT "git_integrations_credentials_check" CHECK ((
        "git_integrations"."auth_type" = 'access_token'
        AND "git_integrations"."encrypted_token" IS NOT NULL
        AND "git_integrations"."github_installation_id" IS NULL
      ) OR (
        "git_integrations"."auth_type" = 'github_app'
        AND "git_integrations"."provider" = 'github'
        AND "git_integrations"."encrypted_token" IS NULL
        AND "git_integrations"."github_installation_id" IS NOT NULL
        AND "git_integrations"."external_repo_id" IS NOT NULL
      )) NOT VALID;