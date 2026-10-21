---
"@ovr/capture": patch
"@ovr/worker": patch
---

Fix a memory leak in snapshot diffs that grew worker memory until it ran out, and log the worker's memory use every minute.
