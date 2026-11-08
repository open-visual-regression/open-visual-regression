---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/reviews": patch
---

After upgrading, a background job copies older snapshots' baselines onto the snapshots, in batches every 15 minutes, until done. Upgrading adds a small `backfills` table.
