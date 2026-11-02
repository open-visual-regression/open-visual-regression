---
"@ovr/worker": minor
"@ovr/web": minor
"@ovr/queue": minor
---

Large builds no longer wait behind a steady stream of PR builds. The new default `deadline` capture queue policy still runs small builds first, but never past a large build's deadline. Set `OVR_CAPTURE_QUEUE_POLICY=round-robin` to keep the previous order.
