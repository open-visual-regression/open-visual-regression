# 23 · /projects list page

> Status: ARCHIVED — core delivered; remaining items intentionally dropped. The card grid and
> empty state ship (`ProjectCardsList` / `ProjectCardListItem` / `NoProjectsSection`); the card
> shows a builds count + baseline branch. The changed-count badge (1.4) and the recent-run
> status-icon + relative-timestamp row (1.5) were not built and are not planned.

Gate: authenticated user sees project card grid; zero projects shows empty state with CTA; changed-count badge visible when > 0.

Depends on: c21-project-schema (done)

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (ProjectsScreen)
Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-states.jsx` (empty state)

- [x] 1.1 `apps/web/app/(authenticated)/projects/page.tsx` (RSC): fetches all projects; renders empty state or card grid
- [x] 1.2 `ProjectCardsList` + `ProjectCardListItem`: responsive grid; card shows name, description, git main branch, diff threshold; links to `/projects/[projectId]`
- [x] 1.3 `NoProjectsSection`: empty state with "new project" CTA button

- [ ] 1.4 Add amber filled `Badge` with changed-count to each card (hide when 0) — requires build/diff data from `c38-runs-list`
- [ ] 1.5 Add bottom row to card: run count + most recent run `StatusIcon` + relative timestamp — requires builds data from `c38-runs-list`
- [ ] 1.6 Component tests:
  - Card grid renders with mock projects
  - Empty state renders when array is empty
  - Changed-count badge hidden when 0; visible when > 0
