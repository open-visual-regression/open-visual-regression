DELETE FROM "git_integrations" WHERE "provider" = 'gitea';--> statement-breakpoint
ALTER TABLE "git_integrations" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."git_provider";--> statement-breakpoint
CREATE TYPE "public"."git_provider" AS ENUM('github');--> statement-breakpoint
ALTER TABLE "git_integrations" ALTER COLUMN "provider" SET DATA TYPE "public"."git_provider" USING "provider"::"public"."git_provider";--> statement-breakpoint
ALTER TABLE "git_integrations" DROP COLUMN "base_url";