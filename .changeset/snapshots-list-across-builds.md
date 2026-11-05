---
"@ovr/web": minor
"@ovr/api": patch
"@ovr/db": patch
---

`snapshots.list` lists every build's snapshots when no `buildId` is given, sorted by status or alphabetically, with each snapshot's build and project. Upgrading adds an index on snapshots without locking the table.
