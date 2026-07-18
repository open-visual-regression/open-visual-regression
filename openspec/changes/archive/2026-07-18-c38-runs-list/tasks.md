# 38 · Runs list

Gate: project page shows builds table with DiffStrip per row; filter tabs narrow the list; clicking a row navigates to run detail.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (RunsScreen)

- [x] `apps/web/app/(authenticated)/projects/[projectId]/page.tsx`: fetches project + builds; renders `BuildsSection`
- [x] `BuildsSection` + `NoBuildsSection`: empty state or table
- [x] `BuildsTable`: columns: status icon · name/commitSha · branch · status badge · date

- [x] 1.1 Add `DiffStrip` to each row: 3px left-edge vertical strip; color mapped from build status

- [x] 1.2 Make full row a link to `/projects/[projectId]/builds/[buildId]`

- [x] 1.3 Filter tab bar above the table:
  - Implemented differently — shipped as a faceted filter bar (`BuildsFilters` + `FacetBar`:
    status / branch / author facets) plus `BuildsSearchField`, not a fixed status-tab strip.
    Functionally satisfies the gate ("filters narrow the list"); the "all/changed/pass/fail/pending"
    tabs with inline counts were superseded by the richer multi-facet UI.

- [x] 1.4 Component tests:
  - Covered by `builds-section/__tests__/{BuildsSection,BuildsTable,BuildsFilters}.test.tsx`
    (facet filtering + table rendering). The literal "active tab highlighted" assertion no longer
    applies (no tabs); filtering behaviour is tested via the facet bar instead.
