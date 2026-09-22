---
"@ovr/api": patch
"@ovr/web": patch
---

Expose `snapshots.rebuild`, which re-captures the given snapshots of a build.

Reviewers and admins can rebuild up to 100 snapshots of a build at a time.
`snapshots.getOne` now reports `isRebuildable` so a caller can tell whether a
snapshot can be rebuilt before asking.
