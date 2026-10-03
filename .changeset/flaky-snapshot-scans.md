---
"@ovr/queue": patch
"@ovr/db": patch
"@ovr/builds": patch
"@ovr/worker": patch
---

Check stories for flakiness on a schedule. Turn it on with `OVR_FLAKY_DETECTION_ENABLED`, or `worker.flakyDetection.enabled` in the Helm chart, and set how often it runs with `OVR_FLAKY_DETECTION_CRON`.
