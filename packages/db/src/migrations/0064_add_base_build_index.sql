-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "builds_baseBuildId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "builds_baseBuildId_idx" ON "builds" USING btree ("base_build_id");--> statement-breakpoint
ALTER TABLE "builds" VALIDATE CONSTRAINT "builds_base_build_id_builds_id_fk";
