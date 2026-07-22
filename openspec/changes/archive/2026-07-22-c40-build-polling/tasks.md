# 40 · Build status polling

> Archived — superseded: live status shipped via an oRPC event stream (`BuildStatusStream`), not 5s polling.

Gate: run detail page with a pending build polls every 5s; SegmentedProgress updates live; polling stops when build reaches terminal status.

- [x] 1.1 Install `@tanstack/react-query` in `apps/web`; wrap `(authenticated)/layout.tsx` with `QueryClientProvider` (client component wrapper)
- [x] 1.2 Create `apps/web/app/api/builds/[buildId]/status/route.ts`:
  - `GET /api/builds/[buildId]/status`
  - Validate session; fetch build + snapshot/diff counts by status
  - Return `{ status, snapshotCounts: { passed, changed, failed, pending } }`
- [x] 1.3 Extract `RunDetailClient.tsx` (`"use client"`) from run detail page:
  - Receives initial `build` data as props (from RSC)
  - `useQuery` with `queryKey: ["build-status", buildId]`, `queryFn` → fetch `/api/builds/[buildId]/status`
  - `refetchInterval: (query) => isTerminal(query.data?.status) ? false : 5000`
  - Renders `SegmentedProgress` and status header using live query data
  - Terminal statuses: `"passed" | "needs_review" | "error"`
- [x] 1.4 Component tests:
  - Non-terminal status: polling continues; SegmentedProgress updates on new data
  - Terminal status: `refetchInterval` returns false; polling stops
