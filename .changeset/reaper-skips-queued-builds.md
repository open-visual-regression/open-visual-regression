---
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/queue": patch
"@ovr/worker": patch
---

The build reaper no longer fails builds that are only waiting in the queue. A build with no snapshot or diff updates for `OVR_REAPER_STALE_MINUTES` is now reaped only when none of its extract, capture, diff or finalize jobs is still waiting, delayed, prioritized or running, so a build queued behind a long backlog waits its turn instead of failing with "Build timed out". Builds whose jobs are gone are still reaped, and each one is logged with its id, age and reason. The Helm chart exposes the threshold as `worker.reaperStaleMinutes`.
