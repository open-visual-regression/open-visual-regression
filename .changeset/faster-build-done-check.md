---
"@ovr/worker": patch
"@ovr/db": patch
---

Checking whether a build has finished no longer scans every diff ever recorded after each snapshot's diff, so many workers running large builds no longer overload the database and slow down the web UI.
