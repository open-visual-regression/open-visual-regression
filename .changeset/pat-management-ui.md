---
"@ovr/web": minor
---

Add a personal access token management page under user settings.

Users can create and revoke `ovr_pat_...` tokens scoped to their own account
rather than a project, for AI agents and other tools that need to read build
results without a human relaying them. Unlike project API keys, personal
access tokens carry the caller's own permissions and are rejected outright by
any endpoint that requires a specific token type.
