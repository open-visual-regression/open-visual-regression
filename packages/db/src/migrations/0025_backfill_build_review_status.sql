UPDATE "builds" b
SET "review_status" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "diffs" d
    JOIN "snapshots" s ON s."id" = d."snapshot_id"
    WHERE s."build_id" = b."id" AND COALESCE(d."pixel_diff_count", 0) > 0
  ) THEN 'auto_approved'
  ELSE 'unchanged'
END::"public"."build_review_status"
WHERE b."review_status" = 'not_required' AND b."processing_status" = 'success';
