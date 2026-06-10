# 23 · /projects list page

Gate: authenticated user sees project card grid; zero projects shows empty state with CTA; changed-count badge visible when > 0.

Depends on: c21-project-schema (schema + repos must land first)

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (ProjectsScreen)
Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-states.jsx` (empty state)

- [ ] 1.1 `apps/web/app/(authenticated)/projects/page.tsx` (RSC):
  - Fetch all projects with `router.projects.list()`
  - If empty → render empty state (1.3); otherwise → card grid (1.2)

- [ ] 1.2 `ProjectCard` component:
  - `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`; `gap: 1px`; hairline grid
  - Card: `var(--ovr-bg-elevated)` bg; `4px` radius; padding 16px
  - Top row: project name (`h3`) + amber filled `Badge` with changed count (hide when 0) — requires build/diff data from `c38-runs-list`
  - Middle: default git branch + diff threshold (caption)
  - Bottom row: run count + most recent run `StatusIcon` + relative timestamp — requires build data from `c38-runs-list`
  - Links to `/projects/[projectId]`

- [ ] 1.3 Empty state:
  - Full-width centered container; `1px dashed var(--ovr-border-subtle)` border; `var(--pixel-grid)` bg (checkerboard CSS in globals.css)
  - `∅` at 48px in `--ovr-fg-muted`
  - "no projects yet" + "create your first project to start capturing visual snapshots"
  - Primary `Button` "new project" → `/projects/new`

- [ ] 1.4 Component tests:
  - Card grid renders with mock projects
  - Empty state renders when array is empty
  - Changed-count badge hidden when 0; visible when > 0
