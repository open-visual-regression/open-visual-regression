# 20 · API keys

Gate: user can generate an API key; full key shown once in reveal banner; key never shown again in list; user can revoke a key.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (ApiKeysScreen)

- [x] 1 `packages/api/src/contracts/apiKeys.ts`: `create` contract (input: `{ name: string }`; output: `{ key: string }`), `list` contract (input: `{ limit, offset }`; output: `{ apiKeys: ApiKeyItem[], total: number }`), `revoke` contract (input: `{ keyId: string }`; output: void); update `contracts/index.ts`

- [x] 2 `apps/web/lib/router/os.ts`: add `adminMiddleware` derived builder — calls `auth.api.getSession`; throws `UNAUTHORIZED` if no session; throws `FORBIDDEN` if `session.user.role !== "admin"`; extends context with `{ session }`

- [x] 3 `apps/web/lib/router/apiKeys.ts`: `"use server"`;
  - `create`: call `auth.api.createApiKey({ name, prefix: "ovr_api_key_", userId })`; return `{ key }`; `.actionable()`
  - `list`: call `auth.api.listApiKeys({ query: { limit, offset }, headers })`; return `{ apiKeys, total }`; `.actionable()`
  - `revoke`: call `auth.api.deleteApiKey({ keyId, headers })`; `.actionable()`
  - Update `router/index.ts`

- [x] 4 Integration tests: `apps/web/lib/router/__tests__/apiKeys.integration.test.ts`
  - `create`: UNAUTHORIZED (no cookie), FORBIDDEN (non-admin), returns key with `ovr_api_key_` prefix, persists to DB
  - `list`: UNAUTHORIZED, FORBIDDEN, empty list, returns keys, respects limit/offset
  - `revoke`: UNAUTHORIZED, FORBIDDEN, deletes from DB
