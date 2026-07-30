UPDATE "git_integrations" "gi"
SET "check_context" = 'Open Visual Regression / ' || "p"."name"
FROM "projects" "p"
WHERE "p"."id" = "gi"."project_id" AND "gi"."check_context" = 'ovr/visual-review';
