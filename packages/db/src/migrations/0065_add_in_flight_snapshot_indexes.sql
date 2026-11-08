-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "diffs_pending_snapshotId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "diffs_pending_snapshotId_idx" ON "diffs" USING btree ("snapshot_id") WHERE "diffs"."processing_status" = 'pending';--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "snapshots_inFlight_buildId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "snapshots_inFlight_buildId_idx" ON "snapshots" USING btree ("build_id") WHERE "snapshots"."status" in ('queued', 'processing');
