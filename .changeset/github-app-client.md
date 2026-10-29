---
"@ovr/git-status": patch
---

Add a GitHub App client that looks up the app and its installations, and mints installation tokens scoped to one repository, caching them until shortly before they expire. `OVR_GITHUB_API_URL` overrides the GitHub API root.
