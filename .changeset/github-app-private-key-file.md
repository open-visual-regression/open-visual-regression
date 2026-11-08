---
"@ovr/web": minor
"@ovr/worker": minor
"@ovr/git-status": patch
---

**Breaking:** The web app and worker read the GitHub App's private key from a mounted file named by `OVR_GITHUB_APP_PRIVATE_KEY_FILE`, so the key no longer sits in their environment. `OVR_GITHUB_APP_PRIVATE_KEY` is no longer read.

- **Docker Compose:** mount the `.pem` file as a Compose secret and set `OVR_GITHUB_APP_ID` and `OVR_GITHUB_APP_PRIVATE_KEY_FILE` in `docker-compose.override.yml`. See the GitHub App docs page.
- **Helm with `githubApp.privateKey`:** nothing to change, as long as the key is a multi-line string rather than one line with `\n` escapes.
- **Helm with `existingSecret`:** move the key into a Secret of its own, set `githubApp.appId` and `githubApp.existingSecret`, and remove both `OVR_GITHUB_APP_*` keys from the shared Secret.
