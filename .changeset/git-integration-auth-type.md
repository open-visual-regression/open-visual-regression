---
"@ovr/db": patch
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Upgrading runs a migration that records how each project's git integration authenticates, ahead of GitHub App support. Existing token integrations keep working unchanged.
