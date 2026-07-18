# 26 · Delete project

Gate: admin-only danger-zone button opens an AlertDialog showing what will be
deleted (build/snapshot/baseline counts + "stored files"); confirm stays
disabled until the project name is typed exactly; on confirm the project and all
of its data are deleted, object storage is purged asynchronously, and the user is
redirected to `/projects`.

Depends on: c25-project-settings (project layout + settings page) — **shipped**.

Read: `design.md` (architecture + why the original prefix / org-scoping /
outbox / storage-model tasks changed).
Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx`
(`DeleteProjectScreen` — danger-zone card + confirm dialog).

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

## DB repository (packages/db)

- [ ] 3.1 `packages/db/src/repository/projects.ts`:
  - Change `deleteProject(id)` → `deleteProject(id, organizationId, tx?)`:
    `DELETE FROM projects WHERE id = ? AND organization_id = ?` `.returning()`
    so the handler knows whether a row was actually removed.
  - Add `getDeletionCounts({ projectId, organizationId })` returning
    `{ buildCount, snapshotCount, diffCount, baselineCount }` (builds from
    `projects.totalBuildsCount` or a `COUNT`; snapshots/diffs via `COUNT` joined
    through `builds`; baselines by `project_id`).
- [ ] 3.2 `packages/db/src/repository/storageOutbox.ts` — add
  `removeByProject(tx, projectId)` (`DELETE FROM storage_outbox WHERE project_id = ?`),
  since these rows have no FK and do not cascade.
- [ ] 3.3 Repository integration tests
  (`packages/db/src/__tests__/projects.integration.test.ts`): counts are correct;
  `deleteProject` removes the project and cascades builds/snapshots/diffs/
  baselines; a mismatched `organizationId` deletes nothing.

## Contract (packages/api)

- [ ] 4.1 `packages/api/src/contracts/projects.ts` — add `deleteProjectContract`
  (input `{ id: z.uuidv7() }`; output
  `{ buildCount, snapshotCount, diffCount, baselineCount }`, all
  `z.number().int().nonnegative()`) and register it on the `contract` object.

## Router handler (apps/web)

- [ ] 5.1 `apps/web/lib/router/projects.ts` — add `deleteProject`:
  `os.projects.deleteProject.use(authenticatedMiddleware).use(adminMiddleware).handler(…).actionable()`:
  - `getProject({ projectId: input.id, organizationId })` → `NOT_FOUND` if absent.
  - Gather counts via `getDeletionCounts`.
  - `dbClient.transaction`: `deleteProject(input.id, organizationId, tx)` +
    `storageOutbox.removeByProject(tx, input.id)`.
  - After commit: `await enqueueProjectPurge({ projectId: input.id })`.
  - `revalidatePath("/", "layout")` (refreshes the projects list + `@sidebar`).
  - Return the counts.
- [ ] 5.2 Handler integration tests
  (`apps/web/lib/router/__tests__/projects.integration.test.ts`): returns
  correct counts; project + cascading rows + `storage_outbox` rows deleted;
  cross-org project not deletable (NOT_FOUND); `enqueueProjectPurge` called with
  the project id.

## UI — settings danger zone (apps/web)

- [ ] 6.1 `settings/page.tsx` — pre-fetch deletion counts (extend the existing
  `Promise.all`) and render a danger-zone `<section>` at the bottom with the
  destructive "delete project…" button + `DeleteProjectDialog`, passing the
  project and counts as props. Already admin-gated by the page's `verifyRole`.
- [ ] 6.2 `settings/_components/delete-project/DeleteProjectDialog.tsx`
  (`"use client"`), following `RevokeApiKeyButton`:
  - `AlertDialog` titled `delete {project.name}?`, destructive tone.
  - Evidence list: `N builds`, `N snapshots`, `N baselines`, `all stored files`;
    body copy "this will permanently delete the project and everything stored
    under it. cannot be undone."
  - Type-to-confirm `Input`; `AlertDialogAction` disabled until
    `typedName === project.name` (and while pending).
  - `useServerAction(serverClient.projects.deleteProject, { interceptors:
    [onSuccess(() => router.push("/projects")), onError(setError)] })`.
- [ ] 6.3 Component tests
  (`settings/_components/delete-project/__tests__/DeleteProjectDialog.test.tsx`):
  renders name + counts; confirm disabled by default; wrong name → still
  disabled; exact name → enabled; confirm executes the action and redirects.

## Verify

- [ ] 7.1 `pnpm check-types`, `pnpm lint`, and the affected Vitest projects pass.
