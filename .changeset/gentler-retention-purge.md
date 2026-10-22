---
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/worker": patch
---

The daily retention purge is gentler on small databases. It deletes expired builds in small batches with a pause between them, stops after a per-project time budget, runs one project at a time across all workers, and logs a summary for each project. Tune it with `OVR_PURGE_CONCURRENCY`, `OVR_PURGE_BATCH_SIZE`, `OVR_PURGE_BATCH_PAUSE_MS` and `OVR_PURGE_TIME_BUDGET_MS`, or `worker.purge.*` in the Helm chart.
