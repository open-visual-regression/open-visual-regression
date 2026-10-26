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
  spyOnBrowserServers,
  test,
  uploadArtifactWithIframe,
} from "./fixtures";

const { CAPTURE_JOB_TIMEOUT_MS } = vi.hoisted(() => ({ CAPTURE_JOB_TIMEOUT_MS: 4_000 }));

vi.mock("../lib/captureTimeouts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/captureTimeouts")>();
  return { ...actual, CAPTURE_JOB_TIMEOUT_MS };
});

vi.mock("@ovr/capture-browser/timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ovr/capture-browser/timeouts")>()),
  CONTEXT_CLOSE_TIMEOUT_MS: 500,
  BROWSER_CLOSE_TIMEOUT_MS: 1_000,
}));

const SNAPSHOT_COUNT = 3;
const STALLED_CAPTURE_MS = CAPTURE_JOB_TIMEOUT_MS * (SNAPSHOT_COUNT + 1);

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

describe("captureBuildGroup", () => {
  test("closes the browser and leaves the rest of the group uncaptured when it runs out of time", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, IFRAME_HTML);
    const [first, second, third] = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-c" },
      ],
    });

    const updateStatus = dbClient.snapshots.updateStatus;
    vi.spyOn(dbClient.snapshots, "updateStatus").mockImplementationOnce(async (id, status) => {
      await new Promise((resolve) => setTimeout(resolve, STALLED_CAPTURE_MS));
      return updateStatus(id, status);
    });

    const { servers } = spyOnBrowserServers();

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [
        first!.id,
        second!.id,
        third!.id,
      ]),
    ).rejects.toThrow(TimeoutError);

    expect(servers).toHaveLength(1);
    expect(await browserProcesses(servers[0]!)).toEqual([]);

    // Its browser was killed mid-capture, so it waits for the retry too.
    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "processing" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "queued" });
    expect(await dbClient.snapshots.findById(third!.id)).toMatchObject({ status: "queued" });
  }, 60_000);

  test("kills the browser when it runs out of time during a story that never returns", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithHangingStory(false));
    const [hanging] = await dbClient.snapshots.createMany({
      values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-hang" }],
    });
    const { servers } = spyOnBrowserServers((server) => {
      server.close = hangForever;
    });

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [hanging!.id]),
    ).rejects.toThrow(TimeoutError);

    expect(servers).toHaveLength(1);
    expect(await browserProcesses(servers[0]!)).toEqual([]);
    expect(await dbClient.snapshots.findById(hanging!.id)).toMatchObject({
      status: "processing",
    });
  }, 60_000);
});
