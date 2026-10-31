-- ovr:no-transaction
-- Better Auth 1.7.3+ identifies accounts by (provider_id, account_id) and no longer
-- writes the issuer column. Fold the issuer into trusted-proxy account IDs so the
-- same subject from a different identity provider never matches an existing user.
UPDATE "account" SET "account_id" = "issuer" || '#' || "account_id" WHERE "provider_id" = 'trusted-proxy' AND NOT starts_with("account_id", "issuer" || '#');--> statement-breakpoint
-- New code never writes issuer, so it has to accept NULL; nothing reads it anymore.
-- squawk-ignore ban-drop-not-null
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "account_providerId_accountId_uidx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "account_issuer_accountId_uidx";
