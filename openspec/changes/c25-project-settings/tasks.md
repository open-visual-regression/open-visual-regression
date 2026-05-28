# 25 · Project settings

Gate: settings page renders general form + variants table; saving form persists changes; adding/removing variants persists to DB; `?created=1` shows "next step" toast.

Depends on: c24-new-project (errors.ts + projects service must exist)

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (ProjectSettingsScreen)

- [ ] 1.1 `apps/web/app/(authenticated)/projects/[slug]/layout.tsx` (RSC):
  - Load project via `db.projects.findBySlug(slug)` → `notFound()` if missing
  - Pass project to children via slot props or `React.cache`

- [ ] 1.2 `apps/web/app/(authenticated)/projects/[slug]/settings/layout.tsx`:
  - Tab nav: "runs" · "settings" · "api" · "logs"
  - Links: `/projects/[slug]/builds` · `/projects/[slug]/settings` · `/projects/[slug]/settings/api` · `/projects/[slug]/settings/logs`
  - "api" and "logs" → "coming soon" placeholder pages
  - `?created=1` → accent-tone Toast "project created — add a variant to start capturing" (auto-dismiss 6s)

- [ ] 1.3 `packages/services/src/projects.ts` — add `updateProject(id, patch, callerId)`:
  - If patch includes `slug`: `db.projects.slugExists` → throw `SlugConflictError`
  - `db.projects.update(id, patch)`
  - Unit tests: slug conflict throws; success updates

- [ ] 1.4 `packages/api/src/contracts/projects.ts` — add `updateProject` contract (input: `{ id, patch }`); update index

- [ ] 1.5 `apps/web/lib/router/projects.ts` — add `updateProject` handler: validate session; call service; `.actionable()`; on `SlugConflictError` → `ORPCError("CONFLICT")`

- [ ] 1.6 `packages/services/src/projects.ts` — add `addVariant(projectId, data, callerId)` + `removeVariant(variantId, callerId)`:
  - `addVariant`: count variants → throw `LimitExceededError` if ≥ 10; `db.variants.create`
  - `removeVariant`: `db.variants.delete(variantId)`
  - Unit tests: 10 variants → `LimitExceededError`; add/remove call correct repo methods

- [ ] 1.7 `packages/api/src/contracts/projects.ts` — add `addVariant` + `removeVariant` contracts; update index

- [ ] 1.8 `apps/web/lib/router/projects.ts` — add `addVariant` + `removeVariant` handlers with `.actionable()`

- [ ] 1.9 `apps/web/app/(authenticated)/projects/[slug]/settings/page.tsx` (RSC):
  - General form (`"use client"` component): name · slug · default branch · diff threshold %; "save changes" button
    - `useServerAction(router.projects.updateProject, { interceptors: [...] })`
  - Variants table: columns: name · browser · viewport (W×H) · × remove button
    - Remove button: `useServerAction(router.projects.removeVariant)`
  - Add-variant row (always visible): name · browser Select (chromium/firefox/webkit) · width · height · "add" button
    - `useServerAction(router.projects.addVariant, { interceptors: [onError(err => show inline error)] })`

- [ ] 1.10 Component tests:
  - `?created=1`: toast shown on mount; absent without param
  - General form: save calls `updateProject`
  - Add variant: validation inline; success appends row; at limit shows error
  - Remove variant: row disappears
