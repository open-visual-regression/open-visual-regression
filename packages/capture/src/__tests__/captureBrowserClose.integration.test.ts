import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { TimeoutError } from "../lib/captureTimeouts";
import { captureBuildGroup } from "../snapshots";
import {
  browserProcesses,
  describe,
  expect,
  hangForever,
  iframeWithHangingStory,
  markFirstLaunchToHang,
  spyOnBrowserServers,
  test,
  uploadArtifactWithIframe,
} from "./fixtures";

const timeouts = vi.hoisted(() => ({ snapshotMs: 3_000, groupPerSnapshotMs: 2 * 60 * 1000 }));

vi.mock("../lib/captureTimeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/captureTimeouts")>()),
  get SNAPSHOT_CAPTURE_TIMEOUT_MS() {
    return timeouts.snapshotMs;
  },
  get CAPTURE_JOB_TIMEOUT_MS() {
    return timeouts.groupPerSnapshotMs;
  },
}));

vi.mock("@ovr/capture-browser/timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ovr/capture-browser/timeouts")>()),
  CONTEXT_CLOSE_TIMEOUT_MS: 500,
  BROWSER_CLOSE_TIMEOUT_MS: 1_000,
}));

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

describe("captureBuildGroup closing its browser", () => {
  test("finishes the group and kills the browser when browser.close() never resolves", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
    const snapshots = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
      ],
    });
    const { servers } = spyOnBrowserServers((server) => {
      server.close = hangForever;
    });

    await captureBuildGroup(
      mainBuild.id,
      captureConfiguration.browser,
      snapshots.map((snapshot) => snapshot.id),
    );

    expect(servers).toHaveLength(1);
    expect(await browserProcesses(servers[0]!)).toEqual([]);
    for (const snapshot of snapshots) {
      expect(await dbClient.snapshots.findById(snapshot.id)).toMatchObject({ status: "success" });
    }
  }, 60_000);

  test("captures the rest of the group when the timed-out browser's close hangs", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithHangingStory(true));
    const snapshots = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-hang" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
      ],
    });
    markFirstLaunchToHang();
    const { servers } = spyOnBrowserServers((server, index) => {
      if (index === 0) {
        server.close = hangForever;
      }
    });

    await captureBuildGroup(
      mainBuild.id,
      captureConfiguration.browser,
      snapshots.map((snapshot) => snapshot.id),
    );

    expect(servers).toHaveLength(2);
    for (const server of servers) {
      expect(await browserProcesses(server)).toEqual([]);
    }
    for (const snapshot of snapshots) {
      expect(await dbClient.snapshots.findById(snapshot.id)).toMatchObject({ status: "success" });
    }
  }, 60_000);

  test("kills the browser when the group times out during a snapshot that never returns", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    timeouts.snapshotMs = 60_000;
    timeouts.groupPerSnapshotMs = 3_000;
    try {
      await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithHangingStory(false));
      const [hanging] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-hang" }],
      });
      const { servers } = spyOnBrowserServers((server) => {
        server.close = hangForever;
      });

      const start = performance.now();
      await expect(
        captureBuildGroup(mainBuild.id, captureConfiguration.browser, [hanging!.id]),
      ).rejects.toThrow(TimeoutError);

      // Settles once the browser is killed, not after the cleanup grace or the snapshot deadline.
      expect(performance.now() - start).toBeLessThan(20_000);
      expect(servers).toHaveLength(1);
      expect(await browserProcesses(servers[0]!)).toEqual([]);
      // Left for the job's retry rather than errored.
      expect(await dbClient.snapshots.findById(hanging!.id)).toMatchObject({
        status: "processing",
      });
    } finally {
      timeouts.snapshotMs = 3_000;
      timeouts.groupPerSnapshotMs = 2 * 60 * 1000;
    }
  }, 60_000);
});
