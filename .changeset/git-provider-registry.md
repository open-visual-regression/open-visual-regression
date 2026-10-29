---
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Git providers are now modules in a registry, so commit statuses, connection checks and commit and branch links all go through one interface instead of a provider switch in each place.
