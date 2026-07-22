# 40 · Build status polling

> Status: ARCHIVED — superseded / delivered by another means. Live build status shipped as a push
> stream, not periodic polling: an oRPC event iterator over Valkey pub/sub drives `BuildStatusStream`
> (`_components/build-header/BuildStatusStream.tsx`, PR #17), so the run/build detail header updates
> live and stops when the build reaches a terminal status. `@tanstack/react-query` +
> `QueryClientProvider` are wired in `apps/web`, but there is no 5s `refetchInterval` polling and no
> `GET /api/builds/[buildId]/status` REST route — the streaming approach replaced both. Tasks below
> are left unchecked because they describe the abandoned polling design, not the shipped one.

Gate: run detail page with a pending build polls every 5s; SegmentedProgress updates live; polling stops when build reaches terminal status.

- [ ] 1.1 Install `@tanstack/react-query` in `apps/web`; wrap `(authenticated)/layout.tsx` with `QueryClientProvider` (client component wrapper)
- [ ] 1.2 Create `apps/web/app/api/builds/[buildId]/status/route.ts`:
  - `GET /api/builds/[buildId]/status`
  - Validate session; fetch build + snapshot/diff counts by status
  - Return `{ status, snapshotCounts: { passed, changed, failed, pending } }`
- [ ] 1.3 Extract `RunDetailClient.tsx` (`"use client"`) from run detail page:
  - Receives initial `build` data as props (from RSC)
  - `useQuery` with `queryKey: ["build-status", buildId]`, `queryFn` → fetch `/api/builds/[buildId]/status`
  - `refetchInterval: (query) => isTerminal(query.data?.status) ? false : 5000`
  - Renders `SegmentedProgress` and status header using live query data
  - Terminal statuses: `"passed" | "needs_review" | "error"`
- [ ] 1.4 Component tests:
  - Non-terminal status: polling continues; SegmentedProgress updates on new data
  - Terminal status: `refetchInterval` returns false; polling stops
