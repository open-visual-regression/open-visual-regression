# 23 · /projects list page

Gate: authenticated user sees project card grid; zero projects shows empty state with CTA; changed-count badge visible when > 0.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (ProjectsScreen)
Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-states.jsx` (empty state)

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/page.tsx` (RSC):
  - Fetch all projects with `projectsRepo.findAll()`
  - If `projects.length === 0` → render empty state (see 1.3)
  - Otherwise → render card grid

- [ ] 1.2 Project card (`ProjectCard` component):
  - `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`; `gap: 1px`; hairline grid (cards touch, border between them)
  - Each card: `var(--ovr-bg-elevated)` bg; `4px` border-radius; padding 16px
  - Top row: project name (`h3` variant) + amber filled `Badge` showing changed count (hide when 0)
  - Middle: slug label (caption, muted) + default branch (caption)
  - Bottom row: run count + most recent run `StatusIcon` + relative timestamp
  - Card links to `/projects/[slug]/builds`

- [ ] 1.3 Empty state:
  - Full-width centered container; `1px dashed var(--ovr-border-subtle)` border; `var(--pixel-grid)` background (checkerboard CSS, defined in globals.css)
  - `∅` character at 48px in `--ovr-fg-muted`
  - Text: "no projects yet" (body) + "create your first project to start capturing visual snapshots" (caption)
  - Primary `Button` "new project" → links to `/projects/new`

- [ ] 1.4 Component tests:
  - Renders card grid with mock projects
  - Empty state renders when projects array is empty
  - Changed-count badge hidden when count is 0; visible when > 0
