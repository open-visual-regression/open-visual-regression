# 48 · API Keys UI

Gate: user can generate an API key; full key shown once in a reveal banner; key never shown again in list; user can revoke a key.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (ApiKeysScreen)

Depends on: `c20-api-keys` (Phase 1 — contracts + router)

## Phase 1 — UI

- [ ] 1.1 `apps/web/app/(authenticated)/settings/api-keys/page.tsx` (RSC):
  - Fetch keys via `router.apiKeys.list`
  - Table columns: name · prefix (`ovr_api_key_•••`) · created date · last-used date
  - `△` TriangleAlert amber icon when key has never been used
  - "generate key" form (name field + submit) — `"use client"` component using `useServerAction(router.apiKeys.create, { interceptors: [onSuccess(({ key }) => showRevealBanner(key)), onError(...)] })`
  - Revoke button per row: `useServerAction(router.apiKeys.revoke)` + `AlertDialog` confirmation

- [ ] 1.2 `ApiKeyReveal` (`"use client"` component):
  - Accent-tone `Alert` "api key created"; full key in `<code>` + copy button
  - "this key cannot be retrieved again — store it securely"
  - Dismiss × removes from view permanently

- [ ] 1.3 Component tests:
  - Generated key appears in Alert banner; not visible in table
  - After dismiss, key gone
  - Revoke: confirmation required; row removed after confirm
