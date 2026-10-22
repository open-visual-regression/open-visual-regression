-- ovr:no-transaction
-- IF NOT EXISTS would skip an invalid index left by a failed concurrent build, so drop those first.
DO $$
DECLARE
  leftover record;
BEGIN
  FOR leftover IN
    SELECT index_class.relname
    FROM pg_index
    JOIN pg_class index_class ON index_class.oid = pg_index.indexrelid
    JOIN pg_namespace ON pg_namespace.oid = index_class.relnamespace
    WHERE pg_namespace.nspname = current_schema()
      AND NOT pg_index.indisvalid
      AND index_class.relname IN (
        'diffs_baselineSnapshotId_idx',
        'diff_reviews_reviewerId_idx',
        'baselines_approvedBy_idx',
        'builds_createdBy_idx',
        'builds_canceledBy_idx',
        'projects_organizationId_idx',
        'projects_creatorId_idx',
        'invitation_inviterId_idx'
      )
  LOOP
    EXECUTE format('DROP INDEX %I', leftover.relname);
  END LOOP;
END $$;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "diffs_baselineSnapshotId_idx" ON "diffs" USING btree ("baseline_snapshot_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "diff_reviews_reviewerId_idx" ON "diff_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "baselines_approvedBy_idx" ON "baselines" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "builds_createdBy_idx" ON "builds" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "builds_canceledBy_idx" ON "builds" USING btree ("canceled_by");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_organizationId_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "projects_creatorId_idx" ON "projects" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "invitation_inviterId_idx" ON "invitation" USING btree ("inviter_id");
