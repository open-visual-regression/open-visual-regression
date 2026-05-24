# 41 · Diff viewer — side + overlay modes

Gate: diff viewer page loads; side and overlay modes render baseline and current images; diff region overlays toggle on/off.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (DiffScreen)

- [ ] 1.1 Create `apps/web/app/(app)/projects/[slug]/builds/[buildId]/diffs/[diffId]/page.tsx` (RSC):
  - Fetch diff + snapshot + baseline snapshot + build + project
  - Pass image paths (presigned via storage route) to client component

- [ ] 1.2 Create `DiffViewer.tsx` (`"use client"`):
  - Toolbar: mode switcher (side / overlay / slider toggle group) + overlay toggle (Eye/EyeOff icon button) + approve/reject buttons (placeholder, wired in 44-approve-reject)
  - Mode stored in local state (default "side")
  - `showOverlay` boolean in state (default true)

- [ ] 1.3 Side mode (`DiffSideBySide`):
  - Two equal-width panels side by side; each ~50% of available width
  - Left panel: "baseline" label + image; diff regions overlaid as colored rects (remove=red, 40% opacity, 2px red outline)
  - Right panel: "current" label + image; diff regions overlaid (change=amber, add=green)
  - Regions hidden when `showOverlay=false`
  - Images sized to fit panel width; pixel-grid bg behind images

- [ ] 1.4 Overlay mode (`DiffOverlay`):
  - Single full-width frame showing current image
  - All diff regions (add/remove/change) overlaid simultaneously when `showOverlay=true`

- [ ] 1.5 Footer:
  - "N of M changed" counter (navigation wired in 43-diff-shortcuts)
  - Prev/next buttons (ChevronLeft/Right icons) — disabled state for now
  - KeyHint chips: J · K · A · R (rendered but handlers wired in 43)

- [ ] 1.6 Component tests:
  - Side mode: both panels render; overlay rects visible when showOverlay=true; hidden when false
  - Overlay mode: single frame; overlay rects toggle
  - Toolbar mode switcher updates active mode
