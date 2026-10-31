-- ovr:no-transaction
-- squawk-ignore ban-drop-not-null
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "account_providerId_accountId_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX CONCURRENTLY "account_providerId_accountId_uidx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
DROP INDEX CONCURRENTLY IF EXISTS "account_issuer_accountId_uidx";
