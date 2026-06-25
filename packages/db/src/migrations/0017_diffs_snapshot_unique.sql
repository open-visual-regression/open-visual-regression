DROP INDEX "diffs_snapshotId_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "diffs_snapshotId_uidx" ON "diffs" USING btree ("snapshot_id");