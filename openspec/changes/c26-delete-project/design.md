# 26 · Delete project — design

## Goal

Let an **admin** permanently delete a project from its settings page. Deleting a
project removes every row that hangs off it (builds, snapshots, snapshot logs,
diffs, diff reviews, baselines, api keys, git integrations) and every object
stored under it in object storage. The action is irreversible and is guarded by
a type-to-confirm AlertDialog that surfaces exactly what will be destroyed.

## What already exists

- `dbClient.projects.deleteProject(id)` (`packages/db/src/repository/projects.ts`)
  — deletes by `id` only.
- `storage.deletePrefix(prefix)` (`packages/storage`) — pages through
  `ListObjectsV2` + `DeleteObjects`.
- Retention already defers storage cleanup to the worker via a `BUILD_PURGE`
  queue job + `storage_outbox` table (`packages/builds/src/retention.ts`).
- The `RevokeApiKeyButton` (`settings/_components/api-keys-section/`) is the
  reference pattern for a destructive `AlertDialog` + `useServerAction`.
- The design lives in
  `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx`
  (`DeleteProjectScreen`): danger-zone card + AlertDialog with an evidence list
  (builds / snapshots / baselines / stored files) and a type-the-name input.

## Data model — what cascades and what does not

Postgres FK cascades handle almost everything from a single
`DELETE FROM projects WHERE id = …`:

```
projects
├─ builds            (project_id  → cascade)
│  └─ snapshots      (build_id    → cascade)
│     ├─ snapshot_logs (snapshot_id → cascade)
│     └─ diffs         (snapshot_id → cascade)
│        └─ diff_reviews (diff_id   → cascade)
├─ baselines         (project_id  → cascade)
├─ api_keys          (project_id  → cascade)
└─ git_integrations  (project_id  → cascade)
```

**Exception — `storage_outbox` does not cascade.** Its `project_id` column has
no foreign key (`packages/db/src/schemas/builds.ts`), so rows queued by the
retention job survive the project delete and are orphaned. They must be deleted
explicitly, in the same transaction as the project.

## Corrections to the original tasks

Reviewing the shipped code turned up four problems in the first draft of
`tasks.md`:

1. **Wrong storage prefix.** Objects live under `${projectId}/…`
   (e.g. `${projectId}/builds/${buildId}/snapshots/${id}.png`, see
   `packages/capture/src/snapshots.ts` and `packages/builds/src/retention.ts`'s
   `getBuildPrefix`). The draft used `projects/${id}/`, which matches nothing —
   it would delete zero objects. Correct prefix: **`${projectId}/`**.
2. **No org scoping.** `deleteProject(id)` deletes purely by id. Every other
   project handler (`getOne`, `update`) first verifies the project belongs to
   `context.organizationId`. Without that check, an admin of org A could delete
   org B's project by id. The delete **must** be org-scoped.
3. **Orphaned `storage_outbox` rows** (see above) were not accounted for.
4. **Unreliable fire-and-forget storage delete.** The draft said not to await
   `deletePrefix`. If that call throws (or the request dies mid-flight) the DB
   rows are already gone and nothing ever retries the storage delete — the
   objects leak forever. We defer storage cleanup to the worker instead.

## Chosen architecture

### Storage cleanup — dedicated `PROJECT_PURGE` queue job (reliable)

Rather than deleting from S3 inline, the handler enqueues a `PROJECT_PURGE` job
after the DB transaction commits; the worker calls
`storage.deletePrefix(\`${projectId}/\`)`. This mirrors how the rest of the app
defers heavy/fallible storage work to the worker and gives us **BullMQ retries
with exponential backoff** for free (same `attempts: 3` policy as `BUILD_PURGE`).

Ordering: **commit the DB delete first, then enqueue.** Enqueuing before the
commit could delete storage for a project that fails to delete; enqueuing after
commit means a still-referenced project is never touched.

Residual risk: if Redis is unreachable in the window *after* commit, the job is
never queued and the objects leak. This is the same failure surface the
retention path accepts, and the blast radius is orphaned bytes, not data
corruption. A transactional-outbox hardening (write the purge intent in the
delete transaction, drain it from a sweeper that tolerates deleted projects) is
possible but out of scope here — noted as a follow-up. The `storage_outbox`
table as it exists today cannot serve this: its drainer
(`purgeExpiredBuilds` → `drainStorageOutbox`) early-returns when the project row
is gone, so an outbox row written for a deleted project would never drain.

### Layering (per `openspec/config.yaml` architecture rules)

```
DeleteProjectDialog ("use client")
  → useServerAction(serverClient.projects.deleteProject)
    → oRPC handler  (authenticatedMiddleware + adminMiddleware)
        1. verify project ∈ organizationId          → NOT_FOUND
        2. gather counts (builds/snapshots/diffs/baselines)
        3. dbClient.transaction: delete project rows + delete storage_outbox rows
        4. enqueueProjectPurge({ projectId })        (after commit)
        5. revalidatePath("/", "layout")
      → returns { buildCount, snapshotCount, diffCount, baselineCount }
    → onSuccess: router.push("/projects")
```

### Counts for the confirmation UI

The dialog shows what will be destroyed. `builds` is already denormalized on
`projects.totalBuildsCount`; snapshots and diffs need a `COUNT` joined through
`builds`; baselines are counted by `project_id` directly. These are gathered in
one repository call (`projects.getDeletionCounts`) and returned by the handler.
The settings page pre-fetches them in the RSC and passes them to the dialog as
props (no client fetch on open).

## Alternatives considered

- **Inline `deletePrefix` (original draft).** Simplest, but no retry — rejected
  for the leak-on-failure reason above.
- **Reuse `storage_outbox` transactionally.** Cleanest crash-safety, but the
  current drainer is coupled to live projects and `build_id` is `NOT NULL`;
  making it project-aware is a larger change than this feature warrants. Left as
  a documented follow-up.

## Out of scope

- Soft delete / restore / trash. Deletion is permanent by design.
- Bulk / multi-project deletion.
- Deleting the last project's organization.
- Transactional-outbox hardening of the storage purge (follow-up).

## Testing

- **Handler integration** (`apps/web/lib/router/__tests__/projects.integration.test.ts`):
  returns correct counts; project + all cascading rows deleted; `storage_outbox`
  rows for the project deleted; a project in another org is **not** deletable
  (NOT_FOUND); `enqueueProjectPurge` invoked with the project id.
- **Worker** (`apps/worker` / `packages/…`): `PROJECT_PURGE` handler calls
  `deletePrefix("${projectId}/")`.
- **Dialog component tests**: renders with project name + counts; confirm
  disabled by default and while the typed name ≠ project name; enabled on exact
  match; confirm executes the action and redirects to `/projects`.
