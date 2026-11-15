---
"@ovr/web": patch
"@ovr/worker": patch
---

Pages no longer fail with "encountered the unstable value `Date.now()` while prerendering" when signing in through a trusted proxy with `OVR_AUTH_PROXY_JWKS_URL`.
