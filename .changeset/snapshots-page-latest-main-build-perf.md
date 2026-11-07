---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/db": patch
---

The snapshots page loads quickly again on large databases, instead of scanning every snapshot. Upgrading adds two small indexes on in-flight snapshots and pending diffs.
