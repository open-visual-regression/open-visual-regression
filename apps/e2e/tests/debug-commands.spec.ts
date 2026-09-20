import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, test } from "./fixtures";
import { runOvr } from "./support/cli";
import { seedReviewableSnapshot } from "./support/seedReviewableSnapshot";

test.describe("CLI debug commands", () => {
  test("should list, inspect, diff and download a needs_review snapshot", async ({
    seedClient,
  }) => {
    const reviewable = await seedReviewableSnapshot(seedClient);
    const { token: pat } = await seedClient.accessTokens.create({ name: "e2e-debug-commands" });

    const list = await runOvr(
      ["snapshots", "list", reviewable.buildId, "--status", "needs_review", "--json"],
      pat,
    );
    expect(list.exitCode, list.stderr).toBe(0);
    const { snapshots } = JSON.parse(list.stdout) as { snapshots: { id: string }[] };
    expect(snapshots.map((snapshot) => snapshot.id)).toContain(reviewable.snapshotId);

    const get = await runOvr(["snapshots", "get", reviewable.snapshotId], pat);
    expect(get.exitCode, get.stderr).toBe(0);
    expect(get.stdout).toContain(reviewable.targetTitle);
    expect(get.stdout).toContain(reviewable.targetName);
    expect(get.stdout).toContain("needs_review");

    const diff = await runOvr(["diffs", "get", reviewable.snapshotId], pat);
    expect(diff.exitCode, diff.stderr).toBe(0);
    expect(diff.stdout).toContain("Review:     needs_review");
    expect(diff.stdout).toMatch(/Diff %:\s+(-|\d)/);

    const outDir = await mkdtemp(path.join(tmpdir(), "ovr-e2e-download-"));
    try {
      const download = await runOvr(
        ["snapshots", "download", reviewable.snapshotId, "--out", outDir],
        pat,
      );
      expect(download.exitCode, download.stderr).toBe(0);

      const current = await readFile(path.join(outDir, "current.png"));
      expect(current.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      );
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
