---
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/worker": patch
---

The daily retention purge no longer pins Postgres for hours. Deleting a snapshot had to scan the whole diffs table to clear `diffs.baseline_snapshot_id`, which had no index; that index now exists, along with the other missing indexes on foreign keys whose parent rows can be deleted. The migration builds them with `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, so it doesn't block writes and keeps an index you already created by hand under the same name. The purge itself now deletes expired builds in small batches with a pause between them, stops after a per-project time budget, runs one project at a time across all workers, and logs a summary for each project. Tune it with `OVR_PURGE_CONCURRENCY`, `OVR_PURGE_BATCH_SIZE`, `OVR_PURGE_BATCH_PAUSE_MS` and `OVR_PURGE_TIME_BUDGET_MS`, or `worker.purge.*` in the Helm chart.
