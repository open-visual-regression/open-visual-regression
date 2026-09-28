---
"@ovr/db": patch
"@ovr/worker": patch
---

Fix a finished build occasionally getting every snapshot twice and going back to processing when its extract job ran again, for example after the worker restarted mid-extract.
