import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

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

vi.mock("../lib/captureTimeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/captureTimeouts")>()),
  SNAPSHOT_CAPTURE_TIMEOUT_MS: 3_000,
}));

vi.mock("@ovr/capture-browser/timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ovr/capture-browser/timeouts")>()),
  CONTEXT_CLOSE_TIMEOUT_MS: 500,
  BROWSER_CLOSE_TIMEOUT_MS: 1_000,
}));

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

describe("captureBuildGroup", () => {
  test("finishes the group and kills its browser when the browser never closes", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
    const [first, second] = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
      ],
    });
    const { servers } = spyOnBrowserServers((server) => {
      server.close = hangForever;
    });

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id]);

    expect(await browserProcesses(servers[0]!)).toEqual([]);
    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "success" });
  }, 60_000);

  test("captures the rest of the group when a timed-out browser never closes", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithHangingStory(true));
    const [before, hanging, after] = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-hang" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
      ],
    });
    markFirstLaunchToHang();
    const { servers } = spyOnBrowserServers((server) => {
      server.close = hangForever;
    });

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [
      before!.id,
      hanging!.id,
      after!.id,
    ]);

    expect(servers).toHaveLength(2);
    expect(await browserProcesses(servers[0]!)).toEqual([]);
    expect(await dbClient.snapshots.findById(before!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.snapshots.findById(hanging!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.snapshots.findById(after!.id)).toMatchObject({ status: "success" });
  }, 60_000);
});
