CREATE TABLE "build_extract_inputs" (
	"build_id" uuid PRIMARY KEY NOT NULL,
	"targets" jsonb NOT NULL,
	"viewports" jsonb NOT NULL,
	"diff_threshold" numeric(3, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "build_extract_inputs" ADD CONSTRAINT "build_extract_inputs_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "builds_projectId_branch_createdAt_id_idx" ON "builds" USING btree ("project_id","branch","created_at","id");