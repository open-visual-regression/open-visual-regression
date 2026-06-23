CREATE TABLE "storage_outbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"prefix" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "storage_outbox_projectId_idx" ON "storage_outbox" USING btree ("project_id");