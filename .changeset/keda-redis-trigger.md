---
"@ovr/worker": minor
---

The chart builds the worker's KEDA trigger. Set `worker.keda.redisAddress`, and
optionally `worker.keda.listLength` and `worker.keda.authenticationRef`, instead
of writing `worker.keda.triggers` by hand. Existing `triggers` keep working.
