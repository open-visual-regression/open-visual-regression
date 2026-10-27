ALTER TABLE "build_extract_defaults" ADD COLUMN "external_request_allowlist" jsonb;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "external_request_allowlist" jsonb;