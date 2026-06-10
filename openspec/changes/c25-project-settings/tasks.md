# 25 · Project settings

Gate: settings page renders general form + capture configurations table; saving form persists changes; adding/removing capture configurations persists to DB; `?created=1` shows "next step" toast.

Depends on: c24-new-project (errors.ts + projects service must exist)

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (ProjectSettingsScreen)

- [ ] 1.1 `apps/web/app/(authenticated)/projects/[projectId]/layout.tsx` (RSC):
  - Load project via `router.projects.getOne({ projectId })` → `notFound()` if missing
  - Pass project to children via slot props or `React.cache`

- [ ] 1.2 `apps/web/app/(authenticated)/projects/[projectId]/settings/layout.tsx`:
  - Tab nav: "runs" · "settings" · "api" · "logs"
  - Links: `/projects/[projectId]/builds` · `/projects/[projectId]/settings` · `/projects/[projectId]/settings/api` · `/projects/[projectId]/settings/logs`
  - "api" and "logs" → "coming soon" placeholder pages
  - `?created=1` → accent-tone Toast "project created — add a capture configuration to begin capturing" (auto-dismiss 6s)

- [ ] 1.3 Add `retentionDays` column to the `projects` table (`packages/db/src/schemas/schemas.ts`): `integer("retention_days").notNull().default(90)`. Run `drizzle-kit generate`; commit migration.

- [ ] 1.4 `packages/services/src/projects.ts` — add `updateProject(id, patch, callerId)`:
  - If patch includes `retentionDays`: validate `retentionDays >= 1` → throw `ValidationError` if not
  - `db.projects.updateProject(id, patch)`
  - Unit tests: invalid `retentionDays` throws; success updates

- [ ] 1.5 `packages/api/src/contracts/projects.ts` — add `updateProject` contract (input: `{ id, patch }`, where `patch` includes `retentionDays?: number`); update index

- [ ] 1.6 `apps/web/lib/router/projects.ts` — add `updateProject` handler: validate session; call service; `.actionable()`; on `ValidationError` → `ORPCError("BAD_REQUEST")`

- [ ] 1.7 `packages/services/src/projects.ts` — add `addCaptureConfiguration(projectId, data, callerId)` + `removeCaptureConfiguration(captureConfigurationId, callerId)`:
  - `addCaptureConfiguration`: `db.captureConfigurations.countByProject(projectId)` → throw `LimitExceededError` if ≥ 10; `db.captureConfigurations.addCaptureConfiguration(...)`
  - `removeCaptureConfiguration`: `db.captureConfigurations.deleteCaptureConfiguration(captureConfigurationId)`
  - Unit tests: 10 capture configurations → `LimitExceededError`; add/remove call correct repo methods

- [ ] 1.8 `packages/api/src/contracts/projects.ts` — add `addCaptureConfiguration` + `removeCaptureConfiguration` contracts; update index

- [ ] 1.9 `apps/web/lib/router/projects.ts` — add `addCaptureConfiguration` + `removeCaptureConfiguration` handlers with `.actionable()`

- [ ] 1.10 `apps/web/app/(authenticated)/projects/[projectId]/settings/page.tsx` (RSC):
  - General form (`"use client"` component): name · description · git main branch · diff threshold % · retention (days); "save changes" button
    - `useServerAction(router.projects.updateProject, { interceptors: [...] })`
  - Capture configurations table: columns: name · browser · viewport (W×H) · × remove button
    - Remove button: `useServerAction(router.projects.removeCaptureConfiguration)`
  - Add-capture-configuration row (always visible): name · browser Select (chromium/firefox/webkit) · width · height · "add" button
    - `useServerAction(router.projects.addCaptureConfiguration, { interceptors: [onError(err => show inline error)] })`

- [ ] 1.11 Component tests:
  - `?created=1`: toast shown on mount; absent without param
  - General form: save calls `updateProject`, including `retentionDays`
  - Add capture configuration: validation inline; success appends row; at limit shows error
  - Remove capture configuration: row disappears
