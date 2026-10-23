import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type LaunchOptions } from "playwright";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { captureBuildGroup } from "../snapshots";
import { describe, expect, test, uploadArtifactWithIframe } from "./fixtures";

const { SNAPSHOT_CAPTURE_TIMEOUT_MS } = vi.hoisted(() => ({ SNAPSHOT_CAPTURE_TIMEOUT_MS: 3_000 }));

vi.mock("../lib/captureTimeouts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/captureTimeouts")>();
  return { ...actual, SNAPSHOT_CAPTURE_TIMEOUT_MS };
});

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

// Rendering "story-hang" blocks the page's main thread, so the in-page render timeout never fires.
// With hangOnce, it only hangs in browsers marked by markFirstLaunchToHang.
const iframeWithHangingStory = (hangOnce: boolean) =>
  IFRAME_HTML.replace(
    "_render(payload) {",
    `_render(payload) {
          if (payload.storyId === "story-hang" && (${!hangOnce} || window.__OVR_HANG__)) {
            while (true) {}
          }`,
  );

const markFirstLaunchToHang = () => {
  const launch = chromium.launch.bind(chromium);
  return vi.spyOn(chromium, "launch").mockImplementationOnce(async (options?: LaunchOptions) => {
    const browser: Browser = await launch(options);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (contextOptions) => {
      const context = await newContext(contextOptions);
      await context.addInitScript({ content: "window.__OVR_HANG__ = true;" });
      return context;
    };
    return browser;
  });
};

describe("captureBuildGroup", () => {
  test("captures a story on a fresh browser after it hangs the first one", async ({
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
    const launch = markFirstLaunchToHang();

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [
      before!.id,
      hanging!.id,
      after!.id,
    ]);

    expect(launch).toHaveBeenCalledTimes(2);
    expect((await launch.mock.results[0]!.value).isConnected()).toBe(false);
    for (const snapshot of [before, hanging, after]) {
      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({
        status: "success",
        hasRenderError: false,
      });
    }
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
    const launch = vi.spyOn(chromium, "launch");

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [hanging!.id, after!.id]);

    expect(launch).toHaveBeenCalledTimes(3);
    expect(await dbClient.snapshots.findById(hanging!.id)).toMatchObject({
      status: "error",
      errorMessage: `Snapshot capture timed out after ${SNAPSHOT_CAPTURE_TIMEOUT_MS}ms during render`,
    });
    expect(await dbClient.snapshots.findById(after!.id)).toMatchObject({ status: "success" });
  }, 60_000);
});
