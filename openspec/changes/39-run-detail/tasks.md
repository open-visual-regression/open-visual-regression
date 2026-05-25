# 39 · Run detail page

Gate: `/projects/[slug]/builds/[buildId]` renders run header with SegmentedProgress and snapshot card grid; filter tabs work; approve-all and reject-all buttons visible (wired in 44-approve-reject).

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (RunDetailScreen)

## Component tree

```
apps/web/lib/components/
  run-header/
    RunHeader.tsx             — DiffStrip + status + meta + SegmentedProgress
  snapshot-grid/
    SnapshotGrid.tsx          — filter tabs + auto-fill card grid
    SnapshotCard.tsx          — thumbnail + Δ badge + story ID + status
```

## Tasks

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/[slug]/builds/[buildId]/page.tsx` (RSC):
  - Fetch build + all diffs + snapshots
  - Accept `searchParams: { filter?: "changed" | "pass" }` — default "all"

- [ ] 1.2 Build `RunHeader` in `apps/web/lib/components/run-header/`:
  - `DiffStrip` + `StatusIcon` + status text + run ID + branch pill + commit sha + author + duration + relative age
  - `SegmentedProgress` bar: pass / changed / failed / pending segments proportional to snapshot counts

- [ ] 1.3 Build `SnapshotGrid` + `SnapshotCard` in `apps/web/lib/components/snapshot-grid/`:
  - `SnapshotGrid` — filter tabs ("all · changed · pass") + `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
  - `SnapshotCard` — 160px thumbnail area + Δ badge when `diffPercent > 0` + story ID + `StatusIcon`; links to diff page

- [ ] 1.4 Component tests:
  - Header renders correct SegmentedProgress segments
  - Snapshot cards render Δ badge when diffPercent > 0
  - Filter tabs filter the grid
