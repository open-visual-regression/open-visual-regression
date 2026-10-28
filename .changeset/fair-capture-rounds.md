---
"@ovr/worker": patch
"@ovr/web": patch
"@ovr/queue": patch
---

Under the `round-robin` capture queue policy, a newly queued build now joins the round workers are on instead of starting at round one, so a steady stream of small builds no longer starves builds with many snapshots.
