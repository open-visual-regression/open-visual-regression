---
"@ovr/worker": patch
"@ovr/web": patch
"@ovr/db": patch
---

Checking whether a build has finished, and loading the build and snapshot pages, no longer scan every diff ever recorded, so the web UI stays responsive while many workers run large builds.
