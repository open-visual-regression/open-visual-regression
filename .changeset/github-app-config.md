---
"@ovr/git-status": patch
"@ovr/web": patch
"@ovr/worker": patch
---

The web and worker read a GitHub App from `OVR_GITHUB_APP_ID` and `OVR_GITHUB_APP_PRIVATE_KEY`, and refuse to start if only one is set or the key isn't a valid RSA private key.
