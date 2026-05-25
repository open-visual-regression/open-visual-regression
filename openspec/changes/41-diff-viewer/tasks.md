# 41 · Diff viewer — side + overlay modes

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

- [ ] 1.1 Create `apps/web/app/(authenticated)/projects/[slug]/builds/[buildId]/diffs/[diffId]/page.tsx` (RSC):
  - Fetch diff + snapshot + baseline snapshot + build + project
  - Pass image paths (via storage presigned proxy) to `DiffViewer`

- [ ] 1.2 Build `DiffViewer` in `apps/web/lib/components/diff-viewer/` (`"use client"`):
  - `DiffToolbar` — mode toggle group (side / overlay / slider) + Eye/EyeOff overlay toggle + approve/reject placeholder buttons
  - `DiffSideBySide` — two equal panels; diff region rects overlaid; hidden when `showOverlay=false`
  - `DiffOverlay` — single frame; all region types overlaid simultaneously
  - `DiffFooter` — "N of M changed" counter + prev/next buttons (disabled; wired in 43) + KeyHint chips J · K · A · R
  - Mode + showOverlay in local state; default mode "side"

- [ ] 1.3 Component tests:
  - Side mode: both panels render; overlay rects toggle with showOverlay
  - Overlay mode: single frame; overlay rects toggle
  - Toolbar mode switcher updates active mode
