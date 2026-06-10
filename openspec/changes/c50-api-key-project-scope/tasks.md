# 50 · API key project scoping + ownership

Gate: a key created for project A is rejected with `FORBIDDEN` when used to call `builds.getBuildStatus` for a build belonging to project B; the API key list for a project shows each key's owner.

API keys are project-scoped credentials for CI. Each key is created within the context of a single project and is rejected by the builds router for any other project. Each key also has an owner — the user who created it — surfaced in the key list for accountability.

- [x] 1 `apps/web/lib/router/apiKeys.ts` — `create`:
  - Input requires `projectId: z.string()`
  - `auth.api.createApiKey({ body: { name, prefix: "ovr_api_key_", userId: session.user.id, metadata: { projectId } } })`

- [x] 2 `packages/db/src/repository/apiKeys.ts` (new):
  - `findByProject(projectId, { limit, offset })`: query the `apikey` table where `metadata::jsonb ->> 'projectId' = projectId`, joined with `user` on `apikey.referenceId = user.id`
  - Returns `{ id, name, prefix, ownerName, createdAt, lastRequest }[]` + total count
  - `metadata` is stored as a JSON string (`text` column) — filter with `sql\`${apikey.metadata}::jsonb ->> 'projectId' = ${projectId}\``
  - Export from `packages/db/src/index.ts`

- [x] 3 `packages/api/src/contracts/apiKeys.ts`:
  - `apiKeySchema`: add `ownerName: z.string().nullable()`
  - `createApiKeyInputSchema`: add `projectId: z.string()`
  - `listApiKeysInputSchema`: add `projectId: z.string()`

- [x] 4 `apps/web/lib/router/apiKeys.ts` — `list`: call `apiKeysRepo.findByProject(projectId, { limit, offset })` instead of `auth.api.listApiKeys` (which is scoped per-user, not per-project). `revoke` is unaffected — `auth.api.deleteApiKey` operates on a key id directly.

- [x] 5 Integration tests: `apps/web/lib/router/__tests__/apiKeys.integration.test.ts`
  - `list`: only returns keys created with the given `projectId` (covers `create` storing `projectId` in `metadata`)
  - `list`: includes `ownerName` matching the creating user's name for each key

- [x] 6 `apps/web/lib/router/apiKeys.ts` — `create` and `list`: validate `projectId` refers to a project in the caller's organization via `dbClient.projects.getProject`; throw `ORPCError("BAD_REQUEST")` if not found
  - Integration tests: `create` and `list` return `BAD_REQUEST` for a nonexistent `projectId`
