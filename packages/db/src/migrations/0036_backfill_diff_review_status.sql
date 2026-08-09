UPDATE "diffs" "d"
SET "review_status" = CASE
  WHEN "d"."diff_percent" IS NULL OR "d"."diff_percent" > "s"."diff_threshold"
    THEN 'auto_approved'
  ELSE 'unchanged'
END::"public"."diff_review_status"
FROM "snapshots" "s"
WHERE "s"."id" = "d"."snapshot_id"
  AND "d"."review_status" = 'not_required'
  AND "d"."processing_status" = 'success';
