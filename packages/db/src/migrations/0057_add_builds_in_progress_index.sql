-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "builds_inProgress_createdAt_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "builds_inProgress_createdAt_idx" ON "builds" USING btree ("created_at") WHERE "builds"."processing_status" in ('queued', 'processing');
