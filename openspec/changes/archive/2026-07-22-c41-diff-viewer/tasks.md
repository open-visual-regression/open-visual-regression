# 41 · Diff viewer — side + overlay modes

> Status: ARCHIVED — superseded. The per-diff viewer at a `builds/[buildId]/diffs/[diffId]` route
> with a mode-switching `DiffToolbar` (side/overlay/slider) was reimagined as a per-snapshot
> comparison page: `builds/[buildId]/snapshots/[snapshotId]` →
> `_components/snapshot-comparison-section`. The substance of this change ships there, decomposed
> differently: side-by-side is `comparison-view/SplitPanes.tsx` (baseline | new); the overlay + an
> overlay on/off toggle is `comparison-view/NewSnapshotDiffPane.tsx` (diff image overlaid on the new
> snapshot with a "show diff" Switch); approve/reject ship as `snapshot-actions/`. Differences from
> the tasks below: the `diffs/[diffId]` route was never created, there is no unified mode-switcher
> toolbar (side and overlay coexist rather than toggle), and the slider mode (c42) was not built.
> Tasks are left unchecked because they describe the abandoned diff-viewer structure.

Gate: diff viewer page loads; side and overlay modes render baseline and current images; diff region overlays toggle on/off.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (DiffScreen)

## Component tree

```
apps/web/lib/components/
  diff-viewer/
    DiffViewer.tsx            — "use client" root: mode state + showOverlay state
    DiffToolbar.tsx           — mode switcher (side/overlay/slider) + overlay toggle + approve/reject slots
    DiffSideBySide.tsx        — two equal panels: baseline (left) + current (right)
    DiffOverlay.tsx           — single full-width frame with overlay regions
    DiffFooter.tsx            — "N of M changed" + prev/next + KeyHint chips
```

## Tasks

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/[projectId]/builds/[buildId]/diffs/[diffId]/page.tsx` (RSC):
  - Fetch diff + snapshot + baseline snapshot + build + project
  - Pass image paths (presigned via storage route) to `DiffViewer`

- [ ] 1.2 Build `DiffViewer` in `apps/web/lib/components/diff-viewer/` (`"use client"`):
  - `DiffToolbar` — mode toggle group (side / overlay / slider) + Eye/EyeOff overlay toggle + approve/reject placeholder buttons (wired in 44-approve-reject)
  - Mode stored in local state (default "side"); `showOverlay` boolean (default true)

- [ ] 1.3 Build `DiffSideBySide`:
  - Two equal-width panels side by side; each ~50% of available width
  - Left panel: "baseline" label + image; diff regions overlaid as colored rects (remove=red, 40% opacity, 2px red outline)
  - Right panel: "current" label + image; diff regions overlaid (change=amber, add=green)
  - Regions hidden when `showOverlay=false`
  - Images sized to fit panel width; pixel-grid bg behind images

- [ ] 1.4 Build `DiffOverlay`:
  - Single full-width frame showing current image
  - All diff regions (add/remove/change) overlaid simultaneously when `showOverlay=true`

- [ ] 1.5 Build `DiffFooter`:
  - "N of M changed" counter (navigation wired in 43-diff-shortcuts)
  - Prev/next buttons (ChevronLeft/Right icons) — disabled state for now
  - KeyHint chips: J · K · A · R (rendered but handlers wired in 43)

- [ ] 1.6 Component tests:
  - Side mode: both panels render; overlay rects visible when `showOverlay=true`; hidden when false
  - Overlay mode: single frame; overlay rects toggle
  - Toolbar mode switcher updates active mode
