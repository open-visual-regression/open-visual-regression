# 38 · Runs list page

Gate: `/projects/[projectId]/builds` renders table with DiffStrip per row; filter tabs update the list; baseline branch info shown.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (RunsScreen)

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/[projectId]/builds/page.tsx` (RSC):
  - Accept `searchParams: { filter?: "changed" | "pass" | "fail" | "pending" }` — default "all"
  - Fetch builds via `buildsRepo.findByProject(project.id, { status: filterToStatus(filter) })`
  - Render filter tab bar: "all (N)" · "changed (N)" · "pass (N)" · "fail (N)" · "pending (N)"
  - Baseline info line below tabs: "baseline: [defaultBranch] · last updated [relative date]"

- [ ] 1.2 Build row component (`RunRow`):
  - Left edge: `DiffStrip` with status mapped to strip color
  - `StatusIcon` + status text (use build status → UI mapping from config.yaml)
  - Run ID (monospace, muted) · commit sha (7 chars, monospace) · branch pill · author · relative timestamp
  - Full row links to `/projects/[projectId]/builds/[buildId]`

- [ ] 1.3 Empty state for filtered view:
  - When filter is active and no results: "no [filter] runs" + "clear filter" link

- [ ] 1.4 Component tests:
  - All filter tabs render with correct counts
  - Each row shows DiffStrip with correct status color
  - Active filter tab is highlighted; URL updates on tab click
