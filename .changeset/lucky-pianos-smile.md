---
"@ovr/web": patch
"@ovr/worker": patch
---

Compare snapshots against their baselines in parallel.

The diff worker ran at BullMQ's default concurrency of one, so a build's
snapshots were compared strictly one at a time. Each comparison downloads the
capture and its baseline from object storage and decodes both PNGs, so on
remote S3 a large build spent minutes in a queue that used a single core and
one request at a time.

It now runs `OVR_DIFF_CONCURRENCY` (default `4`, `worker.diffConcurrency` in
the chart) comparisons at once. Worker memory scales with it, since each
comparison holds the capture, its baseline, and the diff image uncompressed.
