# 32 · Snapshot capture service

Gate: unit tests pass with mocked Playwright and storage; snapshot record updated to "captured" after successful run; SnapshotLog records created for console output.

- [ ] 1.1 Install `playwright` (chromium only) in `packages/services` as a peer dep; actual browser binary installed in `apps/worker`
- [ ] 1.2 Create `packages/services/src/snapshots.ts`:

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

- [ ] 1.3 Unit tests (mock Playwright via `vi.mock`, mock storage, mock repos):
  - Happy path: screenshot taken; logs created; status updated to "captured"; diff jobs enqueued when last capture
  - Render error: `hasRenderError=true` stored; status still "captured"
  - Not last capture: diff jobs NOT enqueued
  - Route handler aborts a request to a third-party origin and continues a request to the storybook origin
