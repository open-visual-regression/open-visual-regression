# 43 · Diff viewer keyboard shortcuts + navigation

Gate: pressing J/K navigates to next/previous changed snapshot; prev/next buttons work; A/R trigger approve/reject (approve/reject Server Actions wired in 44).

- [ ] 1.1 Create `apps/web/app/api/builds/[buildId]/changed-diffs/route.ts`:
  - `GET /api/builds/[buildId]/changed-diffs`
  - Returns ordered list of `{ diffId, snapshotStoryId }` for diffs with `status = "needs_review"`

- [ ] 1.2 Add keyboard shortcut handler in `DiffViewer.tsx`:
  - `useEffect` → `window.addEventListener("keydown", handler)`; cleanup on unmount
  - Fetch changed-diffs list on mount (or pass as prop from RSC)
  - `J`: navigate to next changed diff (`router.push(...)`)
  - `K`: navigate to previous changed diff
  - `A`: call approve action (stub until 44-approve-reject)
  - `R`: call reject action (stub until 44-approve-reject)
  - Guard: ignore key events when focus is in an input/textarea

- [ ] 1.3 Wire prev/next buttons in footer to same navigation logic as J/K

- [ ] 1.4 Update footer "N of M changed" counter:
  - N = index of current diffId in changed-diffs list (1-based)
  - M = total changed diffs in build

- [ ] 1.5 Component tests:
  - `J` keydown: router navigates to next diff URL
  - `K` keydown: router navigates to previous diff URL
  - First diff: `K` and prev button disabled (no previous)
  - Last diff: `J` and next button disabled (no next)
  - Key events in input element: not handled (ignored)
