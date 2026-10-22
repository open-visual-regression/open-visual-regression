-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "invitation_inviterId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "invitation_inviterId_idx" ON "invitation" USING btree ("inviter_id");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "baselines_approvedBy_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "baselines_approvedBy_idx" ON "baselines" USING btree ("approved_by");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "builds_createdBy_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "builds_createdBy_idx" ON "builds" USING btree ("created_by");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "builds_canceledBy_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "builds_canceledBy_idx" ON "builds" USING btree ("canceled_by");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "diff_reviews_reviewerId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "diff_reviews_reviewerId_idx" ON "diff_reviews" USING btree ("reviewer_id");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "diffs_baselineSnapshotId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "diffs_baselineSnapshotId_idx" ON "diffs" USING btree ("baseline_snapshot_id");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "projects_organizationId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "projects_organizationId_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "projects_creatorId_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "projects_creatorId_idx" ON "projects" USING btree ("creator_id");
