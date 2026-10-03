CREATE TABLE "snapshot_variants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"browser" varchar(50) NOT NULL,
	"viewport_width" integer NOT NULL,
	"viewport_height" integer NOT NULL,
	"target_id" varchar(255) NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"image_hash" varchar(64),
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "snapshot_variants" ADD CONSTRAINT "snapshot_variants_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshot_variants" ADD CONSTRAINT "snapshot_variants_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshot_variants_project_browser_viewport_target_lastSeenAt_idx" ON "snapshot_variants" USING btree ("project_id","browser","viewport_width","viewport_height","target_id","last_seen_at");--> statement-breakpoint
CREATE INDEX "snapshot_variants_snapshotId_idx" ON "snapshot_variants" USING btree ("snapshot_id");--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_variant_id_snapshot_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."snapshot_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshots_variantId_idx" ON "snapshots" USING btree ("variant_id");