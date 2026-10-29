---
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Git providers can offer connections: access an admin sets up once for the instance, which projects pick repositories from. GitHub's connection is the instance's GitHub App, and each status it posts uses a token scoped to the one repository. If a provider rejects a cached connection token, OVR fetches a fresh one and retries once.
