# 48 · API Keys UI

Gate: user can generate a project-scoped API key; full key shown once in a reveal banner; key never shown again in list; list shows each key's owner; user can revoke a key.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (ApiKeysScreen)

Depends on: `c20-api-keys`, `c25-project-settings`, `c50-api-key-project-scope`

API keys are scoped to a single project (see `c50-api-key-project-scope`), so this page lives under project settings — replacing the "coming soon" placeholder at `/projects/[slug]/settings/api` from `c25-project-settings`. `projectId` comes from the project loaded in `apps/web/app/(authenticated)/projects/[slug]/layout.tsx`.

- [ ] 1 `apps/web/app/(authenticated)/projects/[slug]/settings/api/page.tsx` (RSC):
  - Fetch keys via `router.apiKeys.list({ projectId })`
  - Table columns: name · prefix (`ovr_api_key_•••`) · owner · created date · last-used date
  - `△` TriangleAlert amber icon when key has never been used
  - "generate key" form (name field + submit) — `"use client"` component using `useServerAction(router.apiKeys.create, { interceptors: [onSuccess(({ key }) => showRevealBanner(key)), onError(...)] })`, passing `{ projectId, name }`
  - Revoke button per row: `useServerAction(router.apiKeys.revoke)` + `AlertDialog` confirmation

- [ ] 2 `ApiKeyReveal` (`"use client"` component):
  - Accent-tone `Alert` "api key created"; full key in `<code>` + copy button
  - "this key cannot be retrieved again — store it securely"
  - Dismiss × removes from view permanently

- [ ] 3 Component tests:
  - Generated key appears in Alert banner; not visible in table
  - After dismiss, key gone
  - Revoke: confirmation required; row removed after confirm
  - Table shows owner name per key
