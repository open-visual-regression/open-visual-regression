---
"@ovr/web": patch
"@ovr/worker": patch
---

When the build queue can't be reached, uploads now fail within seconds and the build is marked as failed with the reason, instead of hanging and staying queued.
