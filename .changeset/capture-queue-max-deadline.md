---
"@ovr/worker": minor
"@ovr/web": minor
"@ovr/queue": minor
---

Large builds no longer wait behind newer, smaller builds for up to two hours: after 15 minutes in the queue, builds queued later can't pass them. Set `OVR_CAPTURE_QUEUE_MAX_DEADLINE_MINUTES` to change the limit.
