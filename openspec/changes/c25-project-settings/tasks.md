# 25 · Project settings

Gate: settings page renders general form + capture configurations table; saving form persists changes; adding/removing capture configurations persists to DB; `?created=1` shows "next step" toast.

Depends on: c24-new-project

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (ProjectSettingsScreen)

- [ ] 1.1 `apps/web/app/(authenticated)/projects/[projectId]/layout.tsx` (RSC):
  - Load project via `serverClient.projects.getOne({ projectId })` → `notFound()` if missing
  - Pass project to children via `React.cache` or slot

- [ ] 1.2 `apps/web/app/(authenticated)/projects/[projectId]/settings/layout.tsx`:
  - Tab nav: "runs" · "settings" · "api" · "logs"
  - Links: `/projects/[projectId]` · `/projects/[projectId]/settings` · `/projects/[projectId]/settings/api` · `/projects/[projectId]/settings/logs`
  - "api" and "logs" → "coming soon" placeholder pages
  - `?created=1` → accent-tone Toast "project created — add a capture configuration to begin capturing" (auto-dismiss 6s)

- [ ] 1.3 Add `retentionDays` column to `projects` table (`packages/db/src/schemas/schemas.ts`): `integer("retention_days").notNull().default(90)`. Run `drizzle-kit generate`; commit migration.

- [ ] 1.4 `packages/api/src/contracts/projects.ts` — add contracts; update index:
  - `updateProject`: input `{ id, patch: { name?, description?, gitMainBranch?, diffThreshold?, retentionDays? } }`; output void
  - `addCaptureConfiguration`: input `{ projectId, data: { name, browser, viewportWidth, viewportHeight } }`; output void
  - `removeCaptureConfiguration`: input `{ captureConfigurationId }`; output void

- [ ] 1.5 `apps/web/lib/router/projects.ts` — add handlers, each `.use(authenticatedMiddleware).use(adminMiddleware)` + `.actionable()`:
  - `updateProject`: if `patch.retentionDays !== undefined && patch.retentionDays < 1` → `throw new ORPCError("BAD_REQUEST")`; else `dbClient.projects.updateProject(input.id, input.patch)`
  - `addCaptureConfiguration`: if `dbClient.captureConfigurations.countByProject(input.projectId) >= 10` → `throw new ORPCError("BAD_REQUEST")`; else `dbClient.captureConfigurations.addCaptureConfiguration(input.projectId, input.data)`
  - `removeCaptureConfiguration`: `dbClient.captureConfigurations.deleteCaptureConfiguration(input.captureConfigurationId)`
  - Update `router/index.ts`

- [ ] 1.6 Integration tests (`apps/web/lib/router/__tests__/projects.integration.test.ts`):
  - `updateProject` with `retentionDays < 1` → `BAD_REQUEST`
  - `updateProject` with a valid patch → project updated
  - `addCaptureConfiguration` at the 10-configuration limit → `BAD_REQUEST`
  - `addCaptureConfiguration` under the limit → configuration created
  - `removeCaptureConfiguration` → configuration deleted

- [ ] 1.7 `apps/web/app/(authenticated)/projects/[projectId]/settings/page.tsx` (RSC):
  - General form (`"use client"` component): name · description · git main branch · diff threshold % · retention days; "save changes" button
    - `useServerAction(router.projects.updateProject, { interceptors: [...] })`
  - Capture configurations table: columns: name · browser · viewport (W×H) · × remove button
    - Remove button: `useServerAction(router.projects.removeCaptureConfiguration)`
  - Add-capture-configuration row (always visible): name · browser Select (chromium/firefox/webkit) · width · height · "add" button
    - `useServerAction(router.projects.addCaptureConfiguration)`
  - API keys section remains below

- [ ] 1.8 Component tests:
  - `?created=1`: toast shown on mount; absent without param
  - General form: save calls `updateProject`, including `retentionDays`
  - Add capture configuration: validation inline; success appends row; at limit shows error
  - Remove capture configuration: row disappears
