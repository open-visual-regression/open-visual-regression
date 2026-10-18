---
"@ovr/web": patch
---

Speed up loading a snapshot's history, which scanned every snapshot on each page. The upgrade builds the new index without blocking the running app, and two migrators starting at once no longer deadlock on it.
