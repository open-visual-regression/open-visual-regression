ALTER TABLE "projects" ADD COLUMN "total_builds_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "projects" p
SET "total_builds_count" = sub."count"
FROM (
  SELECT "project_id", COUNT(*) AS "count"
  FROM "builds"
  GROUP BY "project_id"
) sub
WHERE p."id" = sub."project_id";
