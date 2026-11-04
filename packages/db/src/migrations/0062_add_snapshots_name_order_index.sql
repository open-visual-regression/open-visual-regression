-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "snapshots_targetTitle_targetName_browser_viewportWidth_id_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "snapshots_targetTitle_targetName_browser_viewportWidth_id_idx" ON "snapshots" USING btree ("target_title","target_name","browser","viewport_width","id");
