-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "snapshots_browser_viewport_target_buildId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "snapshots_browser_viewport_target_buildId_idx" ON "snapshots" USING btree ("browser","viewport_width","viewport_height","target_id","build_id");
