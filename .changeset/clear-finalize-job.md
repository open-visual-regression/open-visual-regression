---
"@ovr/queue": patch
---

Add `clearFinalizeJob`, which drops the finalize job a build has already
completed.

Finalize jobs are keyed by build id and BullMQ keeps completed jobs, so
enqueuing a second finalize for the same build is silently dropped. Clearing the
job first lets a build that has more work to do finalize again.
