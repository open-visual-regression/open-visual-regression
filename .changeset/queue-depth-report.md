---
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/worker": patch
---

Workers now report queue backlog. Once a minute, one worker logs a `queue depth` line with the waiting, active, delayed, prioritized, waiting-children and failed jobs in each queue and the number of queued and processing builds. A short Redis lock makes sure only one worker logs it per interval. Change the interval with `OVR_QUEUE_REPORT_INTERVAL_MS`, or set it to `0` to turn it off. Set `OVR_METRICS_PORT` to also serve the counts as Prometheus gauges on `/metrics`. The Helm chart exposes these as `worker.queueReportIntervalMs`, `worker.metrics` and `worker.podAnnotations`.
