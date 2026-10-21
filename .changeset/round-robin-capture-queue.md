---
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/queue": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Small PR builds no longer wait behind every capture group of a large build queued before them. Capture groups now run round-robin across builds: every queued build's first group, then every build's second, and so on. A build's nth group gets BullMQ priority n, and equal priorities run in the order they were queued. Set `OVR_CAPTURE_QUEUE_POLICY=fifo` (Helm: `worker.captureQueuePolicy`) to keep the previous first-in, first-out order. The Helm chart defaults to `fifo` when KEDA uses its generated trigger, because that trigger only counts the queue's wait list.
