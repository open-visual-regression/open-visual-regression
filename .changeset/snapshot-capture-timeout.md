---
"@ovr/capture": patch
"@ovr/worker": patch
---

A story that freezes the page no longer holds up the rest of its capture group. It now times out and is marked errored.
