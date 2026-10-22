---
"@ovr/web": patch
---

Index the foreign keys that had no index on their referencing column, including `diffs.baseline_snapshot_id`. Without it, deleting a snapshot scanned every diff, which made the retention purge pin the database for hours. The upgrade builds the indexes without blocking the running app and keeps any you already created by hand under the same name.
