---
"@ovr/web": patch
"@ovr/worker": patch
"@ovr/builds": patch
"@ovr/db": patch
---

A migration copies the flaky detection settings and their last run time from `job_settings` into new `settings` and `job_state` tables. The settings stay as they were, and `job_settings` is dropped in a later release.
