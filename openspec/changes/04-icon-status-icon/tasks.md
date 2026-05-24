# 04 · Icon + StatusIcon

Gate: Storybook renders both stories; all 6 StatusIcon states visible with correct Lucide icon + color.

Read: `openspec/designs/screens/open-visual-regression/project/kit/components.jsx`

- [x] 1.1 `lucide-react` installed in `packages/ui`
- [ ] 1.2 Create `packages/ui/src/components/ui/icon.tsx`:
  ```tsx
  // Thin wrapper enforcing OVR icon style defaults
  // Props: icon (LucideIcon), size (number, default 16), plus all SVGProps
  // Enforces: strokeWidth={1.5}, strokeLinecap="square", strokeLinejoin="miter"
  ```
- [ ] 1.3 Create `packages/ui/src/components/ui/status-icon.tsx`:
  ```tsx
  type StatusKind = "changed" | "passed" | "pending" | "stale" | "approved" | "rejected"
  // Maps StatusKind → Icon + inline color via CSS var:
  //   changed  → AlertCircle,   color: var(--ovr-accent-primary)
  //   passed   → CircleCheck,   color: var(--ovr-diff-add)
  //   pending  → LoaderCircle,  color: var(--ovr-status-pending)  + animate-spin
  //   stale    → TriangleAlert, color: var(--ovr-fg-muted)
  //   approved → CircleCheck,   color: var(--ovr-diff-add)
  //   rejected → CircleX,       color: var(--ovr-diff-remove)
  ```
- [ ] 1.4 Create `packages/ui/src/components/ui/__stories__/icon.stories.tsx`: grid of all Lucide icons used in OVR (AlertCircle, CircleCheck, LoaderCircle, TriangleAlert, CircleX, Eye, EyeOff, ChevronLeft, ChevronRight, X, Plus, Settings, Users, Key) at sizes 14 / 16 / 20
- [ ] 1.5 Create `packages/ui/src/components/ui/__stories__/status-icon.stories.tsx`: all 6 StatusKind states in a row on dark background; label each with kind name and token color
- [ ] 1.6 Export `Icon`, `StatusIcon`, `StatusKind` from `packages/ui/src/index.ts`; run `pnpm --filter @ovr/ui check-types` and `build-storybook` to confirm exits 0
