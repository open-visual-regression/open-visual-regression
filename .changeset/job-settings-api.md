---
"@ovr/api": patch
"@ovr/builds": patch
"@ovr/queue": patch
"@ovr/web": patch
---

Let admins read and update flaky detection settings through the API. Saving reschedules the flaky snapshot dispatch, so a new schedule applies without restarting the worker.
