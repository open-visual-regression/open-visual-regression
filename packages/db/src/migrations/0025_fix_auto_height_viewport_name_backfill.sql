-- Custom SQL migration file, put your code below! --

-- Migration 0024 backfilled viewport_name as "{width}x{height}" for existing
-- rows, but "0" height means "auto" everywhere else in the app (see
-- apps/web/lib/router/snapshots.ts and SnapshotHeader.tsx). Correct any
-- rows that still carry that untouched "{width}x0" backfill value.
UPDATE "snapshots"
SET "viewport_name" = "viewport_width" || 'xauto'
WHERE "viewport_height" = 0 AND "viewport_name" = "viewport_width" || 'x' || "viewport_height";