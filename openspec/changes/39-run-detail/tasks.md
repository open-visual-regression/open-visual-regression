# 39 · Run detail page

Gate: `/projects/[slug]/builds/[buildId]` renders run header with SegmentedProgress and snapshot card grid; filter tabs work; approve-all and reject-all buttons visible (wired in 44-approve-reject).

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (RunDetailScreen)

- [ ] 1.1 Create `apps/web/app/(app)/projects/[slug]/builds/[buildId]/page.tsx` (RSC):
  - Fetch build + all diffs + snapshots
  - Accept `searchParams: { filter?: "changed" | "pass" }` — default "all"

- [ ] 1.2 Run header:
  - `DiffStrip` (3px, full height of header block)
  - `StatusIcon` + status text + run ID + branch pill + commit sha + author + duration + relative age
  - `SegmentedProgress` bar below header: pass (green) / changed (amber) / failed (red) / pending (blue) segments proportional to snapshot counts
  - Progress title: "run #[id]" · subtitle: "[N] stories × [M] variants" · summary: "N changed · N failed · N pending"

- [ ] 1.3 Snapshot grid:
  - `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
  - Filter tabs: "all (N)" · "changed (N)" · "pass (N)"
  - Approve-all + reject-all buttons (secondary/destructive) — disabled state placeholder (wired in 44)

- [ ] 1.4 Snapshot card:
  - 160px tall thumbnail area: `var(--ovr-bg-inset)` bg + pixel-grid texture
  - If diff exists + `diffPercent > 0`: amber filled `Badge` "Δ N.NN%" in top-left corner of thumbnail
  - Thumbnail image via `<img src="/api/storage/...">` (routed through presigned URL proxy)
  - Below thumbnail: story ID (monospace, truncated) + `StatusIcon` + status text
  - Card links to `/projects/[slug]/builds/[buildId]/diffs/[diffId]` (if diff exists) else no link

- [ ] 1.5 Component tests:
  - Header renders with correct SegmentedProgress segments
  - Snapshot cards render with Δ badge when diffPercent > 0
  - Filter tabs filter snapshot grid
