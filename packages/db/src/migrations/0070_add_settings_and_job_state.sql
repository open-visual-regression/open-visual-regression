CREATE TABLE "job_state" (
	"job" text PRIMARY KEY NOT NULL,
	"last_run_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "settings" ("key", "value", "updated_by", "updated_at") SELECT "job", "settings", "updated_by", "updated_at" FROM "job_settings";--> statement-breakpoint
INSERT INTO "job_state" ("job", "last_run_at") SELECT "job", "last_run_at" FROM "job_settings" WHERE "last_run_at" IS NOT NULL;--> statement-breakpoint
-- squawk-ignore ban-drop-table
DROP TABLE "job_settings";
