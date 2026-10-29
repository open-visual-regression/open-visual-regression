---
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

Add the `OVR_GITHUB_APP_CLIENT_ID` and `OVR_GITHUB_APP_PRIVATE_KEY` settings (and `githubApp.*` in the Helm chart) for a GitHub App. Both are optional, and OVR refuses to start if only one of them is set or the key can't be read.
