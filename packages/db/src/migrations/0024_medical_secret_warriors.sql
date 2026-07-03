UPDATE "snapshots" SET "viewport_name" = "viewport_width" || 'x' || CASE WHEN "viewport_height" = 0 THEN 'auto' ELSE "viewport_height"::text END WHERE "viewport_name" IS NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ALTER COLUMN "viewport_name" SET NOT NULL;
