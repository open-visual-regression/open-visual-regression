# 06 · DiffStrip + OvrMark

Gate: Storybook shows DiffStrip stretching full height of sibling content; OvrMark at 4 sizes.

Read: `openspec/designs/screens/open-visual-regression/project/kit/components.jsx`
Read: `openspec/designs/design-system/ovr-design-system/project/preview/brand-diff-strip.html`

- [ ] 1.1 Create `packages/ui/src/components/ui/diff-strip.tsx`:
  - Props: `status: "changed" | "passed" | "failed" | "pending" | "stale"`
  - Style: `width: 3px`; `align-self: stretch`; `flex-shrink: 0`; `border-radius: 0`
  - Colors (inline style via CSS var):
    - changed  → `var(--ovr-accent-primary)`
    - passed   → `var(--ovr-diff-add)`
    - failed   → `var(--ovr-diff-remove)`
    - pending  → `var(--ovr-status-pending)`
    - stale    → `var(--ovr-fg-muted)`
- [ ] 1.2 Create `packages/ui/src/components/ui/ovr-mark.tsx`:
  - Props: `size: number` (controls height in px; default 22)
  - Computed width: `Math.max(3, Math.round(size / 6))`
  - Render as `<svg>` with single `<rect width="100%" height="100%" rx="0"/>`; fill `var(--ovr-accent-primary)`; no stroke
  - `aria-hidden="true"`
- [ ] 1.3 Create `__stories__/diff-strip.stories.tsx`:
  - Show all 5 statuses in a flex row; each strip inside a div with 80px height text content to prove `align-self: stretch` works
- [ ] 1.4 Create `__stories__/ovr-mark.stories.tsx`: sizes 16 / 22 / 32 / 48 side by side on dark background
- [ ] 1.5 Export `DiffStrip`, `OvrMark` from `packages/ui/src/index.ts`; run `pnpm --filter @ovr/ui check-types` and `build-storybook` to confirm exits 0
