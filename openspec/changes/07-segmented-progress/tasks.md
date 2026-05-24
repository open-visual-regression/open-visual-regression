# 07 · SegmentedProgress

Gate: Storybook story shows proportional colored segments with title/subtitle/summary.

Read: `openspec/designs/screens/open-visual-regression/project/kit/components-feedback.jsx`

- [ ] 1.1 Create `packages/ui/src/components/ui/segmented-progress.tsx`:
  ```tsx
  interface Segment {
    label: string
    count: number
    color: string  // CSS color value or var()
  }
  interface SegmentedProgressProps {
    segments: Segment[]
    title?: string
    subtitle?: string
    summary?: string
    height?: number  // default 8
  }
  ```
  - Skip segments with count = 0
  - Each segment: `flex` child with `flex-basis` proportional to count / total
  - No gap between segments; no border-radius on individual segments; overall bar `border-radius: 2px` on first/last via CSS
  - Title rendered above bar in `label` typography variant; subtitle next to title in `caption` variant
  - Summary rendered below bar in `caption` variant
- [ ] 1.2 Create `__stories__/segmented-progress.stories.tsx`:
  - Story: pass=14 (green `var(--ovr-diff-add)`) / changed=3 (amber `var(--ovr-accent-primary)`) / failed=1 (red `var(--ovr-diff-remove)`) / pending=4 (blue `var(--ovr-status-pending)`)
  - Title: "run #1284" · Subtitle: "22 stories" · Summary: "3 changed · 1 failed · 4 pending"
  - Show at default height and height=4
