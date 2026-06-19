# 53 · Fix finalizeBuild to handle rejected diffs

Gate: `finalizeBuild` resolves build status with priority error > rejected > needs_review > passed; CLI poller fails fast on a rejected build instead of timing out; tests cover all four outcomes plus the previously-uncovered rejected case.

Depends on: c52-reviewer-schema

Today `finalizeBuild` only checks for `diff.status === "error"` and `"needs_review"` — it never checks for `"rejected"`, so a build containing a rejected diff silently becomes `"passed"`. This change fixes that bug and updates it to read the new `processingStatus`/`reviewStatus` columns from c52-reviewer-schema.

- [ ] 1.1 `packages/api/src/contracts/builds.ts`: add `"rejected"` to `buildStatusSchema` (needed for `pollBuildStatus`'s status type below)

- [ ] 1.2 `packages/services/src/builds.ts`: rewrite `finalizeBuild(buildId)` to read `processingStatus`/`reviewStatus` instead of `status`, with priority order:
  ```ts
  export const finalizeBuild = async (buildId: string): Promise<void> => {
    const diffs = await dbClient.diffs.findByBuild(buildId);

    if (diffs.some((diff) => diff.processingStatus === "error")) {
      await dbClient.builds.updateStatus(buildId, "error", "One or more snapshots failed to diff against their baseline");
      return;
    }

    if (diffs.some((diff) => diff.reviewStatus === "rejected")) {
      await dbClient.builds.updateStatus(buildId, "rejected");
      return;
    }

    if (diffs.some((diff) => diff.reviewStatus === "awaiting_review")) {
      await dbClient.builds.updateStatus(buildId, "needs_review");
      return;
    }

    await dbClient.builds.updateStatus(buildId, "passed");
  };
  ```

- [ ] 1.3 `apps/cli/src/commands/snapshot/poll.ts`: add a `BuildRejectedError` (same shape as `BuildFailedError`) and handle `status === "rejected"` in `pollBuildStatus` by throwing it, so the CLI fails fast instead of polling until timeout

- [ ] 1.4 `apps/cli/src/commands/snapshot/__tests__/poll.test.ts`: add a case asserting `pollBuildStatus` throws `BuildRejectedError` when `getBuildStatus` returns `status: "rejected"`

- [ ] 1.5 `packages/services/src/__tests__/builds.integration.test.ts`: update `seedDiffs` to take `{ processingStatus, reviewStatus }` pairs instead of a single `DiffStatus`; update existing 4 `finalizeBuild` tests to the new fields; add:
  - "marks the build as rejected when any diff is rejected, even if others need review"
  - "marks the build as rejected ahead of needs_review when both are present" (priority ordering)
