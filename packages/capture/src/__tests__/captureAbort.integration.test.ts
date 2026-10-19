import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { TimeoutError } from "../lib/captureTimeouts";
import { captureBuildGroup } from "../snapshots";
import { describe, expect, test, uploadArtifactWithIframe } from "./fixtures";

const { CAPTURE_JOB_TIMEOUT_MS } = vi.hoisted(() => ({ CAPTURE_JOB_TIMEOUT_MS: 4_000 }));

vi.mock("../lib/captureTimeouts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/captureTimeouts")>();
  return { ...actual, CAPTURE_JOB_TIMEOUT_MS };
});

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

    const launch = vi.spyOn(chromium, "launch");

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [
        first!.id,
        second!.id,
        third!.id,
      ]),
    ).rejects.toThrow(TimeoutError);

    const browser = await launch.mock.results[0]!.value;
    expect(browser.isConnected()).toBe(false);

    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "queued" });
    expect(await dbClient.snapshots.findById(third!.id)).toMatchObject({ status: "queued" });
  }, 60_000);
});
