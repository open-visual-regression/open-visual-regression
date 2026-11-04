---
"@ovr/worker": patch
"@ovr/builds": patch
"@ovr/storage": patch
---

Deleting an expired build or project no longer leaves files behind in object storage when the store rejects some deletes, for example when throttled. Leftovers are retried on the next nightly purge.
