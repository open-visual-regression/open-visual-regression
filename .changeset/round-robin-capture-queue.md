---
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/queue": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Small builds no longer wait for every snapshot of a large build queued before them. Set `OVR_CAPTURE_QUEUE_POLICY=fifo` to keep the previous order.
