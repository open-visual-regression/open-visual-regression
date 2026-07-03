-- Custom SQL migration file, put your code below! --

UPDATE "snapshots"
SET "viewport_name" = "viewport_width" || 'xauto'
WHERE "viewport_height" = 0 AND "viewport_name" = "viewport_width" || 'x' || "viewport_height";