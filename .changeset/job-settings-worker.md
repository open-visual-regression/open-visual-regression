---
"@ovr/builds": patch
"@ovr/capture": patch
"@ovr/queue": patch
"@ovr/worker": patch
---

Read flaky detection settings (on or off, schedule, and how many recent builds to consider) from the database instead of the `OVR_FLAKY_DETECTION_*` environment variables, which are removed along with `worker.flakyDetection` in the Helm chart. Remove `worker.flakyDetection` from your Helm values before upgrading; the chart's schema now rejects it.
