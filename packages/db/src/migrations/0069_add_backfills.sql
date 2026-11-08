CREATE TABLE "backfills" (
	"name" text PRIMARY KEY NOT NULL,
	"cursor" text,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
