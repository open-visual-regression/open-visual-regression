# 20 · API keys

Gate: user can generate an API key; full key shown once in reveal banner; key never shown again in list; user can revoke a key.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (ApiKeysScreen)

- [ ] 1.1 `packages/api/src/contracts/apiKeys.ts`: `generateApiKey` contract (input: `{ name }`; output: `{ key: string }`) + `revokeApiKey` contract (input: `{ keyId }`; output: void); update `contracts/index.ts`

- [ ] 1.2 `apps/web/lib/router/apiKeys.ts`: `"use server"`;
  - `generateApiKey`: validate session; `auth.api.createApiKey({ name, prefix: "ovr_pk_live_", userId })`; return `{ key }`; `.actionable()`
  - `revokeApiKey`: validate session; `auth.api.deleteApiKey({ keyId })`; `.actionable()`
  - Update `router/index.ts`

- [ ] 1.3 `apps/web/app/(authenticated)/settings/api-keys/page.tsx` (RSC):
  - Fetch keys via `auth.api.listApiKeys({ userId })`
  - Table columns: name · prefix (`ovr_pk_live_•••`) · created date · last-used date
  - `△` TriangleAlert amber icon when key has never been used
  - "generate key" form (name field + submit) — `"use client"` component using `useServerAction(router.apiKeys.generateApiKey, { interceptors: [onSuccess(({ key }) => showRevealBanner(key)), onError(...)] })`
  - Revoke button per row: `useServerAction(router.apiKeys.revokeApiKey)` + `AlertDialog` confirmation

- [ ] 1.4 `ApiKeyReveal` (`"use client"` component):
  - Accent-tone `Alert` "api key created"; full key in `<code>` + copy button
  - "this key cannot be retrieved again — store it securely"
  - Dismiss × removes from view permanently

- [ ] 1.5 Component tests:
  - Generated key appears in Alert banner; not visible in table
  - After dismiss, key gone
  - Revoke: confirmation required; row removed after confirm
