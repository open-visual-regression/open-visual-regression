---
"@ovr/builds": patch
"@ovr/queue": patch
"@ovr/worker": patch
---

Fix a build staying in processing when it needed to finalize again after an earlier finalize had already run.
