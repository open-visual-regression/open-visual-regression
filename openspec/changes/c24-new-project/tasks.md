# 24 · New project

Gate: slug auto-derives from name input; inline conflict check disables submit; successful creation redirects to project settings with "next step" hint.

Depends on: c21-project-schema

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (NewProjectScreen)

- [ ] 1.1 `packages/services/src/errors.ts`: export `SlugConflictError`, `LimitExceededError`, `SelfActionError`, `ForbiddenError` base classes

- [ ] 1.2 `packages/services/src/projects.ts` — `createProject({ name, slug, defaultBranch }, callerId)`:
  - `db.projects.slugExists(slug)` → throw `SlugConflictError` if true
  - `db.projects.create(...)` → project
  - `db.variants.create({ projectId, name: "default", browser: "chromium", viewportWidth: 1280, viewportHeight: 800 })` → default variant
  - Return project
  - Unit tests (mocked repos): duplicate slug → `SlugConflictError`; success → returns project + creates default variant

- [ ] 1.3 `packages/api/src/contracts/projects.ts`: `createProject` contract (input: `{ name, slug, defaultBranch }`; output: `{ projectSlug: string }`); update `contracts/index.ts`

- [ ] 1.4 `apps/web/lib/router/projects.ts`: `"use server"`; `createProject` handler via `os.projects.createProject` — validate session; call service; `.actionable()`; on `SlugConflictError` → `ORPCError("CONFLICT")`; update `router/index.ts`

- [ ] 1.5 `apps/web/app/api/projects/slug-check/route.ts`: `GET ?slug=X` → `{ available: boolean }` via `db.projects.slugExists`; no auth required

- [ ] 1.6 `apps/web/app/(authenticated)/projects/new/page.tsx` (`"use client"`):
  - Fields: name (on change → derive slug), slug (user-overridable, `/` prefix), default branch (default "main")
  - Slug: debounce 400ms → call `/api/projects/slug-check?slug=X`; inline "slug already in use" error; submit disabled while checking or conflicted
  - `useServerAction(router.projects.createProject, { interceptors: [onSuccess(({ projectSlug }) => navigate.push(`/projects/${projectSlug}/settings?created=1`)), onError(...)] })`

- [ ] 1.7 Component tests:
  - Name input derives slug correctly
  - Slug conflict: inline error; submit disabled
  - Slug available: error cleared; submit enabled
  - Successful submission redirects to settings
