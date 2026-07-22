# 41 · Diff viewer — side + overlay modes

> Archived — superseded: side/overlay shipped as the snapshot comparison page (`snapshot-comparison-section`), not a per-diff viewer.

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

- [x] 1.1 Create `apps/web/app/(authenticated)/projects/[projectId]/builds/[buildId]/diffs/[diffId]/page.tsx` (RSC):
  - Fetch diff + snapshot + baseline snapshot + build + project
  - Pass image paths (presigned via storage route) to `DiffViewer`

- [x] 1.2 Build `DiffViewer` in `apps/web/lib/components/diff-viewer/` (`"use client"`):
  - `DiffToolbar` — mode toggle group (side / overlay / slider) + Eye/EyeOff overlay toggle + approve/reject placeholder buttons (wired in 44-approve-reject)
  - Mode stored in local state (default "side"); `showOverlay` boolean (default true)

- [x] 1.3 Build `DiffSideBySide`:
  - Two equal-width panels side by side; each ~50% of available width
  - Left panel: "baseline" label + image; diff regions overlaid as colored rects (remove=red, 40% opacity, 2px red outline)
  - Right panel: "current" label + image; diff regions overlaid (change=amber, add=green)
  - Regions hidden when `showOverlay=false`
  - Images sized to fit panel width; pixel-grid bg behind images

- [x] 1.4 Build `DiffOverlay`:
  - Single full-width frame showing current image
  - All diff regions (add/remove/change) overlaid simultaneously when `showOverlay=true`

- [x] 1.5 Build `DiffFooter`:
  - "N of M changed" counter (navigation wired in 43-diff-shortcuts)
  - Prev/next buttons (ChevronLeft/Right icons) — disabled state for now
  - KeyHint chips: J · K · A · R (rendered but handlers wired in 43)

- [x] 1.6 Component tests:
  - Side mode: both panels render; overlay rects visible when `showOverlay=true`; hidden when false
  - Overlay mode: single frame; overlay rects toggle
  - Toolbar mode switcher updates active mode
