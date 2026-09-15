---
"@ovr/web": patch
---

Fall back to session auth when the `Authorization` header is not an OVR token.

An OIDC reverse proxy in front of OVR (oauth2-proxy and friends, configured to
pass the authorization header) forwards its own `Bearer <id_token>` on every
request. `callerMiddleware` treated any bearer as an OVR credential, so Better
Auth rejected the proxy's token and every route behind it — builds, snapshots,
diffs, and the screenshots served by `storage.getObject` — returned
`UNAUTHORIZED` for logged-in users. `apiKeyMiddleware` had the same flaw.

Both now look at the bearer's prefix first: one that is not an OVR token is
treated as if no bearer were sent, so `callerMiddleware` authenticates the
session and `apiKeyMiddleware` still reports missing credentials. Validation of
a bearer that does carry an OVR prefix is unchanged.
