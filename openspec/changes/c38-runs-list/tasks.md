# 38 · Runs list

Gate: project page shows builds table with DiffStrip per row; filter tabs narrow the list; clicking a row navigates to run detail.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (RunsScreen)

- [x] `apps/web/app/(authenticated)/projects/[projectId]/page.tsx`: fetches project + builds; renders `BuildsSection`
- [x] `BuildsSection` + `NoBuildsSection`: empty state or table
- [x] `BuildsTable`: columns: status icon · name/commitSha · branch · status badge · date

- [x] 1.1 Add `DiffStrip` to each row: 3px left-edge vertical strip; color mapped from build status

- [x] 1.2 Make full row a link to `/projects/[projectId]/builds/[buildId]`

- [ ] 1.3 Filter tab bar above the table:
  - Tabs: "all (N)" · "changed (N)" · "pass (N)" · "fail (N)" · "pending (N)"
  - Active filter passed as `searchParams.filter`; page re-fetches filtered list
  - "clear filter" link when filter active and no results

- [ ] 1.4 Component tests:
  - All filter tabs render with correct counts
  - Each row shows DiffStrip with correct status color
  - Active filter tab is highlighted
  - Row click navigates to run detail URL
