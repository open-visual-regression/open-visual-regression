# 05 · Badge + KeyHint

Gate: Storybook shows all badge tones × filled/outlined; KeyHint shows J/K/A/R chips.

Read: `openspec/designs/screens/open-visual-regression/project/kit/components.jsx`

- [ ] 1.1 Create `packages/ui/src/components/ui/badge.tsx`:
  - Tones: `"pass" | "fail" | "pending" | "stale" | "changed" | "neutral"`
  - Props: `tone`, `filled?: boolean` (default false)
  - Style: `border-radius: 2px`; `font-size: 10px`; `font-weight: 600`; `letter-spacing: 0.08em`; `text-transform: uppercase`
  - Color mapping (CSS vars from tokens):
    - pass     → `--ovr-diff-add`
    - fail     → `--ovr-diff-remove`
    - pending  → `--ovr-status-pending`
    - stale    → `--ovr-fg-muted`
    - changed  → `--ovr-accent-primary`
    - neutral  → `--ovr-fg-secondary`
  - filled=true: solid background at 15% opacity + solid text color + no border
  - filled=false: transparent bg + 1px solid border in token color + token color text
- [ ] 1.2 Create `packages/ui/src/components/ui/key-hint.tsx`:
  - Props: `children` (string, e.g. `"J"`, `"⌘K"`)
  - Style: height 18px; `background: var(--ovr-bg-inset)`; `border: 1px solid var(--ovr-border-subtle)`; `border-radius: 2px`; `font-size: 10px`; `font-weight: 600`; `font-family: var(--font-mono)`; horizontal padding 4px
- [ ] 1.3 Create `__stories__/badge.stories.tsx`: all 6 tones × filled=true/false in a grid (12 cells total)
- [ ] 1.4 Create `__stories__/key-hint.stories.tsx`: J · K · A · R · ⌘K · ⇧Tab shown side by side
- [ ] 1.5 Export `Badge`, `KeyHint` from `packages/ui/src/index.ts`; run `pnpm --filter @ovr/ui check-types` and `build-storybook` to confirm exits 0
