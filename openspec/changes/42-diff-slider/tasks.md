# 42 · Diff viewer — slider mode

Gate: slider mode renders baseline/current split by draggable amber divider; drag updates clip-path in real time.

Read: `openspec/designs/screens/open-visual-regression/project/kit/screens-builds.jsx` (DiffScreen slider)

- [ ] 1.1 Create `DiffSlider.tsx` (`"use client"`):
  - Single container; baseline image full width underneath; current image full width on top clipped by `clip-path: inset(0 ${100-pos}% 0 0)`
  - `pos` = divider position as percentage (0–100), default 50; stored in state
  - Divider: 2px wide `var(--ovr-accent-primary)` vertical line positioned at `pos%`; `cursor: ew-resize`
  - Handle: 28×28 square amber button centered on divider; shows `↔` character; `cursor: ew-resize`
  - Drag behavior: `pointerdown` on handle → `pointermove` on container → update pos; `pointerup` releases
  - Constrain pos to 2–98 so images always visible

- [ ] 1.2 Wire `DiffSlider` into `DiffViewer.tsx` as the third mode; show when `mode === "slider"`

- [ ] 1.3 Component tests:
  - Renders with divider at 50% by default
  - Simulated drag: `pointerdown` → `pointermove` to 30% → `pointerup` → `pos` updated to 30
  - Current image clip-path reflects pos value
  - Pos constrained: drag below 2 → clamped to 2; drag above 98 → clamped to 98
