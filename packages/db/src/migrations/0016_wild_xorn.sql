CREATE TABLE "pending_storage_purges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"prefix" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pending_storage_purges_projectId_idx" ON "pending_storage_purges" USING btree ("project_id");