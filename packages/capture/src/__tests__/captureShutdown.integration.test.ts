import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { captureBuildGroup } from "../snapshots";
import { describe, expect, test, uploadArtifactWithIframe } from "./fixtures";

vi.mock("../lib/shutdown", () => ({ isShuttingDown: () => true, beginShutdown: () => undefined }));

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

describe("captureBuildGroup", () => {
  test("should leave the group for a retry when a snapshot fails while the worker is shutting down", async ({
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

    vi.spyOn(storage, "uploadFile").mockRejectedValueOnce(new Error("upload interrupted"));

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id]),
    ).rejects.toThrow("upload interrupted");

    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "processing" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "queued" });
    expect(await dbClient.snapshotLogs.findBySnapshot(first!.id)).toHaveLength(0);
  }, 60_000);
});
