# 25 · Project settings page

Gate: settings tab renders general form and variants table; adding/removing variants persists to DB; form saves update project; `?created=1` shows "next step" toast.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-projects.jsx` (ProjectSettingsScreen)

- [ ] 1.1 Create `apps/web/app/(app)/projects/[slug]/layout.tsx` (RSC):
  - Load project via `projectsRepo.findBySlug(slug)` → `notFound()` if missing
  - Pass project to children via `React.cache` or props pattern

- [ ] 1.2 Create `apps/web/app/(app)/projects/[slug]/settings/layout.tsx`:
  - Tab nav: "runs" · "settings" · "api" · "logs" (Tab components)
  - Tabs link to: `/projects/[slug]/builds` · `/projects/[slug]/settings` · `/projects/[slug]/settings/api` · `/projects/[slug]/settings/logs`
  - "api" and "logs" tabs show "coming soon" placeholder pages for now
  - `?created=1` in URL → show accent-tone Toast "project created — add a variant to start capturing" (auto-dismiss 6s)

- [ ] 1.3 Create `apps/web/app/(app)/projects/[slug]/settings/page.tsx` (RSC):
  - General form: name · slug · default branch · diff threshold % (0.00–100.00); "save changes" button
  - Variants table: columns: name · browser · viewport (W×H) · × remove button
  - Inline add-variant row at table bottom (always visible):
    - Inputs: name · browser Select (chromium/firefox/webkit) · width input · height input · "add" button
    - Validate all fields before submit; inline errors below inputs

- [ ] 1.4 Create `apps/web/app/(app)/projects/[slug]/settings/actions.ts`:
  - `updateProject(id, patch)` → calls service; revalidates page
  - `addVariant(projectId, data)` → calls service; on `LimitExceededError` return `{ error: "max 10 variants" }`; revalidates
  - `removeVariant(variantId)` → calls service; revalidates

- [ ] 1.5 Component tests:
  - `?created=1`: "next step" toast shown on mount; not shown without param
  - General form: save calls `updateProject`
  - Add variant: validation inline; success appends row
  - Remove variant: row disappears after confirmation
