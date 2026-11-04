---
"@ovr/db": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Adds a table for the baselines main changes and a merge-base column on builds, in preparation for comparing branches against main as it was when they were cut. The upgrade builds the new index without blocking the running app.
