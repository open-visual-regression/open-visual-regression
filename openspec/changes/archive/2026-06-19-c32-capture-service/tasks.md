# 32 · Snapshot capture service

Gate: unit tests pass with mocked Playwright and storage; snapshot record updated to "captured" after successful run; SnapshotLog records created for console output.

- [x] 1.1 Install `playwright` (chromium only) in `packages/services` as a peer dep; actual browser binary installed in `apps/worker`
- [x] 1.2 Create `packages/services/src/snapshots.ts`:

  `captureSnapshot(snapshotId)`:
  - Load snapshot + build + capture configuration from repos
  - Construct Storybook story URL: `${artifactBaseUrl}/iframe.html?id=${snapshot.targetId}&viewMode=story`
    - `artifactBaseUrl` derived from build.artifactPath in RustFS (use presigned URL or internal URL)
  - Launch Playwright chromium; set viewport to `captureConfiguration.viewportWidth × captureConfiguration.viewportHeight`
  - Before navigating, register `page.route("**/*", ...)`: allow requests whose origin matches `artifactBaseUrl`'s origin (and `data:`/`blob:` URLs); abort all other requests. This is a defense-in-depth measure — uploaded Storybook builds are untrusted content and must not be able to reach other hosts from the worker
  - Navigate to story URL; wait for `networkidle`; capture screenshot as PNG buffer
  - Collect console messages + page errors → `snapshotLogsRepo.createMany(...)`
  - Upload PNG to storage at `builds/${buildId}/snapshots/${snapshotId}.png`
  - `snapshotsRepo.updateStatus(snapshotId, "captured")` + set `imagePath` + set `hasRenderError` if errors captured
  - Check `snapshotsRepo.hasAllCapturedForBuild(buildId)` → if true, enqueue diff job for each snapshot
  - Close Playwright browser

  Implementation deviates from the description above in three ways, found necessary during e2e verification against a real Storybook build:
  - A new `c32-extract` step (`extractBuild`, new `build-extract` queue) splits the uploaded `artifact.tar.gz` into individual files in storage once per build — a single presigned URL can't serve a multi-asset static site (relative asset requests need a real shared origin).
  - `captureSnapshot` runs a local per-job static-file HTTP proxy (`builds/{id}/static/*` fetched from storage on demand) as that shared origin, instead of a single presigned `artifactBaseUrl`.
  - Render-complete detection uses Storybook's `__STORYBOOK_ADDONS_CHANNEL__` pub/sub (`setCurrentStory` / `storyRendered` / `playFunctionThrewException` etc.) rather than `networkidle` — `networkidle` resolves before `play()` interactions finish, producing incomplete/flaky screenshots for stories with interaction tests.

- [x] 1.3 Unit tests (mock Playwright via `vi.mock`, mock storage, mock repos):
  - Happy path: screenshot taken; logs created; status updated to "captured"; diff jobs enqueued when last capture
  - Render error: `hasRenderError=true` stored; status still "captured"
  - Not last capture: diff jobs NOT enqueued
  - Route handler aborts a request to a third-party origin and continues a request to the storybook origin
