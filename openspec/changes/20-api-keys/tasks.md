# 20 · API keys

Gate: user can generate an API key; full key shown once in reveal banner; key never shown again in list; user can revoke a key.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-admin.jsx` (ApiKeysScreen)

- [ ] 1.1 Create `apps/web/app/(app)/settings/api-keys/page.tsx` (RSC):
  - Fetch API keys for current user via Better Auth API Key plugin
  - Table columns: name · prefix (`ovr_api_key_•••` — last 4 chars of key hash) · created date · last-used date
  - Stale indicator: `△` TriangleAlert amber icon in last-used column when key has never been used
  - "generate key" form above table: single name field + primary submit button
  - Revoke button (XIcon, ghost variant) per row with confirmation (inline `AlertDialog`)
- [ ] 1.2 Create `apps/web/app/(app)/settings/api-keys/actions.ts`:
  - `generateApiKey(name)` Server Action:
    - Calls `auth.api.createApiKey({ name, prefix: "ovr_api_key_", userId })`
    - Returns `{ key: string }` (the full plaintext key — only time it's available)
    - Revalidates page
  - `revokeApiKey(keyId)` Server Action → `auth.api.deleteApiKey`; revalidates
- [ ] 1.3 Key reveal UX (client component `ApiKeyReveal.tsx`):
  - After `generateApiKey` returns: show accent-tone `Alert` with `AlertTitle` "api key created"
  - Alert body: full key in `<code>` block + copy button
  - Warning: "this key cannot be retrieved again — store it securely"
  - Alert dismisses on ×; after dismiss the key is gone forever
- [ ] 1.4 Component tests:
  - Generated key appears in Alert; not shown in table
  - After dismiss, key not visible anywhere on page
  - Revoke removes row after confirmation
