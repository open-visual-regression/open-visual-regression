-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "snapshots_baselineSnapshotId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "snapshots_baselineSnapshotId_idx" ON "snapshots" USING btree ("baseline_snapshot_id");--> statement-breakpoint
ALTER TABLE "snapshots" VALIDATE CONSTRAINT "snapshots_baseline_snapshot_id_snapshots_id_fk";
