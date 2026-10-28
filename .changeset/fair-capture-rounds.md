---
"@ovr/worker": patch
"@ovr/web": patch
"@ovr/queue": patch
---

Builds with many snapshots no longer wait behind a steady stream of smaller builds under the `round-robin` capture queue policy.
