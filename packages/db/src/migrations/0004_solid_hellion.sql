ALTER TABLE "diffs" DROP CONSTRAINT "diffs_baseline_snapshot_id_snapshots_id_fk";
--> statement-breakpoint
ALTER TABLE "diffs" ADD CONSTRAINT "diffs_baseline_snapshot_id_snapshots_id_fk" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diffs_snapshotId_idx" ON "diffs" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "snapshots_buildId_idx" ON "snapshots" USING btree ("build_id");