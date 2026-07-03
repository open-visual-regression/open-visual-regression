CREATE TYPE "public"."build_type" AS ENUM('storybook');--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "build_type" "build_type" DEFAULT 'storybook' NOT NULL;