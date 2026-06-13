# 26 · Delete project

Gate: danger zone button opens AlertDialog showing deletion counts; confirm disabled until project name typed exactly; on confirm project deleted and user redirected to /projects.

Depends on: c25-project-settings (project layout + settings page must exist)

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (DeleteProjectScreen)

- [ ] 1.1 `packages/api/src/contracts/projects.ts` — add `deleteProject` contract (input: `{ id }`; output: `{ buildCount, snapshotCount, diffCount }`); update index

- [ ] 1.2 `apps/web/lib/router/projects.ts` — add `deleteProject` handler: `.use(authenticatedMiddleware).use(adminMiddleware)` + `.actionable()`:
  - Fetch build/snapshot/diff counts for the project
  - `dbClient.projects.deleteProject(input.id)` — cascade handles DB rows
  - Fire-and-forget: `storage.deletePrefix(`projects/${input.id}/`)` (don't await)
  - Return `{ buildCount, snapshotCount, diffCount }`
  - On success use `onSuccess` interceptor to redirect

- [ ] 1.3 Integration tests (`apps/web/lib/router/__tests__/projects.integration.test.ts`): `deleteProject` returns correct counts; project + cascading rows deleted; `storage.deletePrefix` called

- [ ] 1.4 `apps/web/app/(authenticated)/projects/[projectId]/settings/DeleteProjectDialog.tsx` (`"use client"`):
  - Trigger: "delete project" destructive button in danger zone
  - Deletion counts pre-fetched in parent RSC, passed as props
  - `AlertDialog`: title "delete [project name]"; body "this will permanently delete N runs, N snapshots, and all associated storage"
  - Confirmation input: disabled until `typedName === project.name`
  - `useServerAction(router.projects.deleteProject, { interceptors: [onSuccess(() => navigate.push("/projects")), onError(...)] })`

- [ ] 1.5 Component tests:
  - Dialog renders with correct project name
  - Confirm disabled by default
  - Wrong name typed: confirm stays disabled
  - Exact name typed: confirm enabled
  - Confirm calls action + redirects
