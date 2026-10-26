import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { captureBuildGroup } from "../snapshots";
import {
  describe,
  expect,
  iframeWithHangingStory,
  markFirstLaunchToHang,
  spyOnBrowserServers,
  test,
  uploadArtifactWithIframe,
} from "./fixtures";

const { SNAPSHOT_CAPTURE_TIMEOUT_MS } = vi.hoisted(() => ({ SNAPSHOT_CAPTURE_TIMEOUT_MS: 3_000 }));

vi.mock("../lib/captureTimeouts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/captureTimeouts")>();
  return { ...actual, SNAPSHOT_CAPTURE_TIMEOUT_MS };
});

describe("captureBuildGroup", () => {
  test("captures a story on a fresh browser after it hangs the first one", async ({
    mainBuild,
    captureConfiguration,
    metrics,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithHangingStory(true));
    const [before, hanging, after] = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-hang" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-b" },
      ],
    });
    const connect = markFirstLaunchToHang();
    const { spy: launch } = spyOnBrowserServers();

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [
      before!.id,
      hanging!.id,
      after!.id,
    ]);

    expect(launch).toHaveBeenCalledTimes(2);
    expect((await connect.mock.results[0]!.value).isConnected()).toBe(false);
    for (const snapshot of [before, hanging, after]) {
      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
        status: "success",
        hasRenderError: false,
      });
    }
    expect(await metrics.scrape()).toContain(
      'ovr_capture_browser_relaunches_total{browser="chromium",reason="timeout"} 1',
    );
  }, 60_000);

  test("errors a story that hangs every browser it runs in and captures the rest of the group", async ({
    mainBuild,
    captureConfiguration,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithHangingStory(false));
    const [hanging, after] = await dbClient.snapshots.createMany({
      values: [
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-hang" },
        { buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" },
      ],
    });
    const { spy: launch } = spyOnBrowserServers();

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [hanging!.id, after!.id]);

    expect(launch).toHaveBeenCalledTimes(3);
    expect(await dbClient.snapshots.findById(hanging!.id)).toMatchObject({
      status: "error",
      errorMessage: `Snapshot capture timed out after ${SNAPSHOT_CAPTURE_TIMEOUT_MS}ms during render`,
    });
    expect(await dbClient.snapshots.findById(after!.id)).toMatchObject({ status: "success" });
  }, 60_000);
});
