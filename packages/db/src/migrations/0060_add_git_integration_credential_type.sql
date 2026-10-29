CREATE TYPE "public"."git_credential_type" AS ENUM('access_token', 'connection');--> statement-breakpoint
-- Only connection integrations leave encrypted_token empty, and the code that writes
-- them ships after this migration. Code from the previous release never sees one.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "git_integrations" ALTER COLUMN "encrypted_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "credential_type" "git_credential_type" DEFAULT 'access_token' NOT NULL;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "connection_id" varchar(255);--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "external_repo_id" varchar(255);--> statement-breakpoint
ALTER TABLE "git_integrations" ADD CONSTRAINT "git_integrations_credentials_check" CHECK ((
        "git_integrations"."credential_type" = 'access_token'
        AND "git_integrations"."encrypted_token" IS NOT NULL
        AND "git_integrations"."connection_id" IS NULL
      ) OR (
        "git_integrations"."credential_type" = 'connection'
        AND "git_integrations"."encrypted_token" IS NULL
        AND "git_integrations"."connection_id" IS NOT NULL
        AND "git_integrations"."external_repo_id" IS NOT NULL
      )) NOT VALID;