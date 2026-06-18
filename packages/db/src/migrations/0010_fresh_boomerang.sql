ALTER TABLE "snapshots" ADD COLUMN "target_title" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "target_name" varchar(255) DEFAULT '' NOT NULL;