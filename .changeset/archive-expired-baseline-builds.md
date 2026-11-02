---
"@ovr/web": minor
"@ovr/worker": minor
"@ovr/builds": patch
"@ovr/db": patch
"@ovr/storage": patch
"@ovr/api": patch
---

Expired builds that still hold a baseline are archived instead of kept whole: only their baseline snapshots remain, and their Storybook, diffs and other snapshots are deleted.
