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

### Storage cleanup — dedicated `PROJECT_PURGE` queue job

Two things are conflated by the word "outbox"; keep them separate:

- **A transactional outbox** (write the purge intent in the delete transaction,
  a sweeper drains it) — **not used.** It's real crash-safety insurance, but the
  existing `storage_outbox` can't serve it: its drainer
  (`purgeExpiredBuilds` → `drainStorageOutbox`) early-returns when the project
  row is gone, and `build_id` is `NOT NULL`. Making it project-aware is more
  machinery than this feature warrants. Left as a documented follow-up.
- **A queue job** (handler enqueues, worker deletes) — **used.**

Why not just `await storage.deletePrefix()` inline in the handler? Two reasons,
both of which matter more because the storage layer is any S3-compatible service,
not just local RustFS:

1. **Unbounded request time.** `deletePrefix` pages `ListObjectsV2` (1000
   keys/page) then `DeleteObjects` (1000/batch). A project with thousands of
   snapshots/diffs/artifacts is many serial round-trips — seconds to minutes
   against a remote bucket. Inlining that blocks the Server Action and risks
   platform/gateway request timeouts.
2. **No retry on failure.** If the S3 call fails partway, the DB rows are already
   gone, so retention can never reclaim the orphans (it only sweeps live
   projects). The objects leak permanently.

So the handler enqueues a `PROJECT_PURGE` job after the DB transaction commits;
the worker calls `storage.deletePrefix(\`${projectId}/\`)`. This mirrors how the
rest of the app defers heavy/fallible storage work to the worker and gives us
**BullMQ retries with exponential backoff** for free (same `attempts: 3` policy
as `BUILD_PURGE`). It's ~30 lines reusing existing infra.

Ordering: **commit the DB delete first, then enqueue.** Enqueuing before the
commit could delete storage for a project that fails to delete; enqueuing after
commit means a still-referenced project is never touched.

Residual risk: if Redis is unreachable in the window *after* commit, the job is
never queued and the objects leak — the same failure surface the retention path
already accepts, and the blast radius is orphaned bytes, not data corruption.
(The transactional-outbox follow-up above is what would close it.)

Simpler alternative if we want to cut scope: inline `await deletePrefix()` with
a caught-and-logged failure. Acceptable for small deployments; the two reasons
above are why the plan doesn't default to it.

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

The dialog shows what will be destroyed: **runs, snapshots, baselines** (no byte
size — it would require an extra `ListObjects` sweep on open, and it isn't worth
the cost/latency). `builds` is already denormalized on
`projects.totalBuildsCount`; snapshots need a `COUNT` joined through `builds`;
baselines are counted by `project_id` directly. Gathered in one repository call
(`projects.getDeletionCounts`) and returned by the handler as
`{ buildCount, snapshotCount, baselineCount }`. The settings page pre-fetches
them in the RSC and passes them to the dialog as props (no client fetch on open).

### UI copy

The app's copy is all lowercase, and per the naming convention **UI labels say
"runs", never "builds"** (only URLs use `/builds`). So `buildCount` renders as
"N runs".

**Danger-zone section** (bottom of the settings page):

- red uppercase eyebrow: `danger zone`
- row title: `delete project`
- description: `permanently removes this project, its runs, snapshots, and all
  files stored for it. this cannot be undone.`
- destructive button: `delete project…`

**Confirmation dialog:**

- title: `delete {project.name}?`
- body: `this will permanently delete this project and everything stored under
  it. this cannot be undone.`
- evidence list (what will be destroyed):
  - `{buildCount} runs`
  - `{snapshotCount} snapshots`
  - `{baselineCount} baselines`
  - `all stored files`
- input label: `type {project.name} to confirm`
- confirm button: `delete project` (disabled until the typed value === name)
- cancel button: `keep project`

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

Two layers carry the coverage — router integration + dialog component — matching
how the rest of the settings features are tested. E2E is deliberately **not**
added (see rationale below).

### Router integration (real containers, no mocks of our own code)

Extend `apps/web/lib/router/__tests__/projects.integration.test.ts` (runs against
real Postgres via Testcontainers, drives `serverClient` with the `admin`/`user`
fixtures). This is the real cascade + authorization surface:

- returns `{ buildCount, snapshotCount, baselineCount }` matching seeded data;
- project row + all cascading rows (builds/snapshots/snapshot_logs/diffs/
  diff_reviews/baselines) are gone afterward;
- the project's `storage_outbox` rows are gone (they don't cascade);
- a **non-admin** `user` gets `FORBIDDEN`; no session gets `UNAUTHORIZED`;
- a project in **another organization** is not deletable — `NOT_FOUND`, and that
  project's rows survive (the cross-org guard);
- the storage purge is scheduled: mock `@ovr/queue/producer`'s
  `enqueueProjectPurge` and assert it was called once with `{ projectId }`.
  (Its actual effect — `deletePrefix` — is asserted in the worker test, so we
  don't couple this test to S3.)

### Worker handler unit test

`PROJECT_PURGE` handler calls `storage.deletePrefix` with exactly `${projectId}/`
— the prefix is the whole contract of the job, and the biggest bug we're fixing,
so it gets a direct assertion.

### Dialog component test (Testing Library, user-facing only)

`DeleteProjectDialog.test.tsx` under `@/test-utils`, mocking `@/lib/router` and
`next/navigation` (the same seam `CreateApiKeyModal.test.tsx` uses). Drive it the
way a person would — by visible text, roles, and labels; assert on what they'd
see. No reading of state, props, or handlers:

- the danger-zone button (`/delete project/i`) opens the dialog;
- the dialog shows the project name and the "N runs / N snapshots / N baselines"
  it's about to destroy;
- the confirm button is **disabled** initially;
- typing a wrong name leaves it disabled; typing the exact name enables it;
- clicking confirm calls the delete action with `{ id }` and, on success,
  routes to `/projects`;
- an action error surfaces an inline message and keeps the user on the page.

### Stories (OVR dogfooding)

OVR screenshots its own Storybook, so the delete UI needs stories that render its
meaningful states for visual regression:

- `DeleteProjectSection.stories.tsx` — the danger-zone card (default; and a
  large-counts variant to check number formatting/layout).
- `DeleteProjectDialog.stories.tsx` — dialog **open** (via `play`/`args` with the
  trigger clicked or `defaultOpen`), showing the evidence list and the disabled
  confirm state; a second story with the name typed so the enabled/destructive
  confirm is captured. Mock the server action in the story context so the story
  is inert.

### Do we need E2E?

Recommendation: **no**, not for this change. The two E2E specs that exist
(`ingest-storybook`, `snapshots`) cover the multi-service capture→diff pipeline,
where the value of a real browser + worker is high. Project deletion has no such
cross-service choreography: the DB cascade is exercised for real by the router
integration test, the authorization is too, and the dialog interaction is covered
by the component test. A Playwright spec would re-verify the same two seams more
slowly and flakily. Revisit only if we later add a user-visible async state to
the purge (e.g. a "deleting…" progress surface) that spans web + worker.
