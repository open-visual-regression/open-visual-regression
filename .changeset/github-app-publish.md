---
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Commit statuses can now be posted through the instance's GitHub App, using a token scoped to the one repository. If GitHub rejects a cached token, OVR mints a fresh one and retries once. "test connection" explains why an app integration can't post, for example when the repository was removed from the installation.
