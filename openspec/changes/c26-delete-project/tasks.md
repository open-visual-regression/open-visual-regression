# 26 · Delete project

Gate: admin-only danger-zone button opens an AlertDialog with a general
irreversible-delete warning (no itemized list of what's removed); confirm stays
disabled until the project name is typed exactly; on confirm the project and all
of its data are deleted, object storage is purged asynchronously, and the user is
redirected to `/projects`.

Depends on: c25-project-settings (project layout + settings page) — **shipped**.

Read: `design.md` (architecture + why the original prefix / org-scoping /
outbox / storage-model tasks changed).
Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx`
(`DeleteProjectScreen` — danger-zone card + confirm dialog; note we do **not**
render its counts/evidence list).

## Queue — `PROJECT_PURGE` job (packages/queue)

- [ ] 1.1 `packages/queue/src/index.ts` — add `QueueName.PROJECT_PURGE = "project-purge"`;
  `ProjectPurgeJobPayload = { projectId: string }`; a `JOB_OPTIONS` entry
  (`attempts: 3`, `backoff: { type: "exponential", delay: 2000 }`, matching
  `BUILD_PURGE`); and `enqueueProjectPurge(payload, connection)`.
- [ ] 1.2 `packages/queue/src/producer.ts` — export the connection-bound
  `enqueueProjectPurge(payload)`.

## Worker — purge handler (apps/worker)

- [ ] 2.1 `apps/worker/src/handlers/projectPurge.ts` — `run(job)` calls
  `storage.deletePrefix(\`${job.data.projectId}/\`)`; `failed(job, error)` logs.
- [ ] 2.2 `apps/worker/src/index.ts` — register a `Worker(QueueName.PROJECT_PURGE,
  projectPurge.run, { connection })` and wire `.on("failed", guard(projectPurge.failed))`.
- [ ] 2.3 Handler test: `run` calls `storage.deletePrefix` with exactly
  `${projectId}/` (the prefix is the job's whole contract).

## DB repository (packages/db)

- [ ] 3.1 `packages/db/src/repository/projects.ts` — change
  `deleteProject(id)` → `deleteProject(id, organizationId, tx?)`:
  `DELETE FROM projects WHERE id = ? AND organization_id = ?` `.returning()` so
  the handler knows whether a row was actually removed. (No count helper — the UI
  doesn't itemize deletions.)
- [ ] 3.2 `packages/db/src/repository/storageOutbox.ts` — add
  `removeByProject(tx, projectId)` (`DELETE FROM storage_outbox WHERE project_id = ?`),
  since these rows have no FK and do not cascade.
- [ ] 3.3 Repository integration tests
  (`packages/db/src/__tests__/projects.integration.test.ts`): `deleteProject`
  removes the project and cascades builds/snapshots/diffs/baselines; a mismatched
  `organizationId` deletes nothing.

## Contract (packages/api)

- [ ] 4.1 `packages/api/src/contracts/projects.ts` — add `deleteProjectContract`
  (input `{ id: z.uuidv7() }`; output `z.void()`) and register it on the
  `contract` object.

## Router handler (apps/web)

- [ ] 5.1 `apps/web/lib/router/projects.ts` — add `deleteProject`:
  `os.projects.deleteProject.use(authenticatedMiddleware).use(adminMiddleware).handler(…).actionable()`:
  - `getProject({ projectId: input.id, organizationId })` → `NOT_FOUND` if absent.
  - `dbClient.transaction`: `deleteProject(input.id, organizationId, tx)` +
    `storageOutbox.removeByProject(tx, input.id)`.
  - After commit: `await enqueueProjectPurge({ projectId: input.id })`.
  - `revalidatePath("/", "layout")` (refreshes the projects list + `@sidebar`).
- [ ] 5.2 Handler integration tests
  (`apps/web/lib/router/__tests__/projects.integration.test.ts`): project +
  cascading rows + `storage_outbox` rows deleted; `user` → FORBIDDEN, no session
  → UNAUTHORIZED; cross-org project → NOT_FOUND and its rows survive;
  `enqueueProjectPurge` (mock `@ovr/queue/producer`) called once with
  `{ projectId }`.

## UI — settings danger zone (apps/web)

Copy is all lowercase and stays general — no itemized list of what's deleted.
Full copy lives in `design.md` → "UI copy".

- [ ] 6.1 `settings/_components/delete-project/DeleteProjectSection.tsx` — the
  danger-zone card: red uppercase `danger zone` eyebrow, `delete project` title,
  description "permanently deletes this project and everything stored for it.
  this cannot be undone.", and the destructive `delete project` button that
  opens the dialog. Takes the `project` as its only prop.
- [ ] 6.2 `settings/page.tsx` — render `<DeleteProjectSection project={…}>` at the
  bottom (no extra data fetch). Already admin-gated by the page's `verifyRole`.
- [ ] 6.3 `settings/_components/delete-project/DeleteProjectDialog.tsx`
  (`"use client"`), following `RevokeApiKeyButton`:
  - `AlertDialog` titled `delete {project.name}?`, destructive tone; body "this
    will permanently delete this project and everything stored under it. this
    cannot be undone." (no evidence/counts list).
  - Type-to-confirm `Input` labelled `type {project.name} to confirm`;
    `AlertDialogAction` (`delete project`) disabled until `typed === project.name`
    (and while pending); cancel labelled `keep project`.
  - `useServerAction(serverClient.projects.deleteProject, { interceptors:
    [onSuccess(() => router.push("/projects")), onError(setError)] })`.

## Tests & stories (apps/web)

- [ ] 7.1 `DeleteProjectDialog.test.tsx` (Testing Library via `@/test-utils`,
  mock `@/lib/router` + `next/navigation`) — user-facing only, no implementation
  details: button opens dialog; project name + irreversible warning shown;
  confirm disabled initially; wrong name stays disabled; exact name enables;
  confirm calls the action with `{ id }` and redirects to `/projects`; action
  error surfaces an inline message.
- [ ] 7.2 Stories for OVR dogfooding:
  `__stories__/DeleteProjectSection.stories.tsx` and
  `__stories__/DeleteProjectDialog.stories.tsx` (open+disabled, and name-typed+
  enabled), with the server action mocked so the stories are inert.
- [ ] 7.3 No E2E spec — the router integration + component tests cover the two
  seams; see `design.md` → "Do we need E2E?".

## Verify

- [ ] 8.1 `pnpm check-types`, `pnpm lint`, and the affected Vitest projects pass.
