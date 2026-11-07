CREATE TYPE "public"."git_auth_type" AS ENUM('token', 'github_app');--> statement-breakpoint
-- Safe for the previous release: only GitHub App integrations leave the token unset, and
-- nothing writes those until the release that reads auth_type.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "git_integrations" ALTER COLUMN "encrypted_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "git_integrations" ADD COLUMN "auth_type" "git_auth_type" DEFAULT 'token' NOT NULL;
