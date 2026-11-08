---
"@ovr/web": patch
"@ovr/worker": patch
---

The Helm chart accepts `githubApp.appId` and `githubApp.privateKey`, and the Compose files pass `OVR_GITHUB_APP_ID` and `OVR_GITHUB_APP_PRIVATE_KEY` through, for publishing commit statuses as a GitHub App.
