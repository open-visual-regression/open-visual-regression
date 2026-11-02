-- ovr:no-transaction
-- now() is stable, so existing baselines get the migration time without a table rewrite. That
-- starts every baseline's clock fresh: none can expire until a full retention window passes.
ALTER TABLE "baselines" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN IF NOT EXISTS "stripped_at" timestamp;--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "baselines_projectId_lastSeenAt_idx";--> statement-breakpoint
CREATE INDEX CONCURRENTLY "baselines_projectId_lastSeenAt_idx" ON "baselines" USING btree ("project_id","last_seen_at");
