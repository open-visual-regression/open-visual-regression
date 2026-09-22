---
"@ovr/capture": patch
"@ovr/db": patch
---

Scope a snapshot's screenshot to the capture attempt that produced it.

Snapshots now record a capture attempt, and each attempt uploads to its own
path. Re-capturing a snapshot no longer overwrites the image an earlier attempt
uploaded, which the presigned-URL cache would otherwise keep serving.
