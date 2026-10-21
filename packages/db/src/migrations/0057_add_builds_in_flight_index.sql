-- ovr:no-transaction
DROP INDEX CONCURRENTLY IF EXISTS "builds_inFlight_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "builds_inFlight_idx" ON "builds" USING btree ("processing_status") WHERE "builds"."processing_status" in ('queued', 'processing');
