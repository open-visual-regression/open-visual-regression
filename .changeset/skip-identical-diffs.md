---
"@ovr/capture": patch
"@ovr/worker": patch
---

Skip downloading and comparing a snapshot against its baseline when both screenshots have the same image hash, since byte-identical screenshots can't differ. The diff is still recorded as unchanged with 0 differing pixels.
