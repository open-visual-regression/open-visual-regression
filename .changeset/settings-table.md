---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/builds": patch
"@ovr/db": patch
---

A migration moves the flaky detection settings and their last run time from `job_settings` into new `settings` and `job_state` tables. The settings stay as they were.
