---
"@ovr/api": patch
"@ovr/web": patch
---

Expose `snapshots.rerun`, which re-captures the given snapshots of a build.

Reviewers and admins can re-run up to 100 snapshots of a build at a time.
`snapshots.getOne` now reports `isRerunnable` so a caller can tell whether a
snapshot can be re-run before asking.
