---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/db": patch
---

Filtering the snapshots page by `current` and a flag no longer hangs on large databases, since the query now starts from current baselines instead of every build's history.
