# 38 · Runs list page

Gate: project page shows builds table with status, branch, commit, and timestamp; filter tabs narrow the list; clicking a row navigates to run detail.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (RunsScreen)

> **Route change from original spec.** Builds are shown on the project detail page (`/projects/[projectId]`) rather than a dedicated `/projects/[projectId]/builds` route. `BuildsSection` + `BuildsTable` already exist. The remaining work is adding filter tabs, DiffStrip status indicator, and wiring row navigation.

## What was built

- [x] `apps/web/app/(authenticated)/projects/[projectId]/page.tsx`: fetches project + builds (`serverClient.builds.list({ projectIds: [projectId] })`); renders `BuildsSection`
- [x] `BuildsSection`: empty state (`NoBuildsSection`) or `BuildsTable`
- [x] `BuildsTable`: columns: status icon · name/commitSha · branch · status badge · date

## Still needed

- [ ] 1.1 Filter tab bar above `BuildsSection`:
  - Tabs: "all (N)" · "changed (N)" · "pass (N)" · "fail (N)" · "pending (N)"
  - Active filter passed as `searchParams.filter`; page re-fetches with `{ status: filterToStatus(filter) }`
  - "clear filter" link when filter active + no results

- [ ] 1.2 Add `DiffStrip` to each `BuildsTable` row:
  - Left-edge 3px vertical strip; color mapped from build status
  - Pass through existing `BuildStatusTableRow` wrapper or add to row component

- [ ] 1.3 Make full row a link to `/projects/[projectId]/builds/[buildId]` (currently no link)

- [ ] 1.4 Component tests:
  - All filter tabs render with correct counts
  - Each row shows DiffStrip with correct status color
  - Active filter tab is highlighted
  - Row click navigates to run detail URL
