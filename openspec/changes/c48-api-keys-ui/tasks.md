# 48 · API Keys UI

Gate: user can generate a project-scoped API key; full key shown once in a reveal banner; key never shown again in list; list shows each key's owner; user can revoke a key.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (ApiKeysScreen)

Depends on: `c20-api-keys`, `c25-project-settings`, `c50-api-key-project-scope`

API keys are scoped to a single project (see `c50-api-key-project-scope`), so this lives under project settings. Implemented as a "new api key" modal + table on the main `/projects/[projectId]/settings` page (`ApiKeysSection`/`ApiKeysTable`) rather than a separate `/settings/api` route — the `c25-project-settings` placeholder route is not used.

- [x] 1 `CreateApiKeyModal` (`apps/web/.../settings/_components/create-api-key/`):
  - "new api key" modal form (name field + submit), `"use client"`, `useServerAction(router.apiKeys.create, { interceptors: [onSuccess(({ key }) => ...), onError(...)] })`, passing `{ projectId, name }`
  - On success, `router.refresh()` so `ApiKeysTable` picks up the new row

- [x] 2 `CreateApiKeyModalReveal` (`"use client"` component):
  - `Alert` "copy this key now, it will only be shown once"; full key in `<code>` + copy button
  - "done" closes the modal; reopening shows the create form again

- [x] 3 `ApiKeysTable` columns: name · owner · created date — added prefix (`ovr_api_key_•••`), last-used date, `△` TriangleAlert never-used icon

- [x] 4 Revoke button per row: `useServerAction(router.apiKeys.revoke)` + `AlertDialog` confirmation

- [x] 5 Component tests (`CreateApiKeyModal.test.tsx`, `ApiKeysTable.test.tsx`):
  - Generated key shown in reveal view; copy-to-clipboard; server error surfaced
  - Reopening after "done" resets to create form
  - Prefix/last-used columns rendered; revoke confirms via `AlertDialog`, calls `router.apiKeys.revoke`, refreshes, and surfaces server errors
