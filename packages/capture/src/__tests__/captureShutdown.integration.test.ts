import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { storage } from "@ovr/storage";

import { ShutdownInterruptError, captureBuildGroup } from "../snapshots";
import { describe, expect, test, uploadArtifactWithIframe } from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

describe("captureBuildGroup", () => {
  test("leaves the group for a retry when a snapshot fails while the worker is shutting down", async ({
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

    const shutdown = new AbortController();
    vi.spyOn(storage, "uploadFile").mockImplementationOnce(async () => {
      shutdown.abort();
      throw new Error("upload interrupted");
    });

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id], {
        shutdownSignal: shutdown.signal,
      }),
    ).rejects.toThrow(ShutdownInterruptError);

    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "processing" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "queued" });
    expect(await dbClient.snapshotLogs.findBySnapshot(first!.id)).toHaveLength(0);
  }, 60_000);

  test("stops before the next snapshot once the worker starts shutting down", async ({
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

    const shutdown = new AbortController();
    const updateStatus = dbClient.snapshots.updateStatus;
    vi.spyOn(dbClient.snapshots, "updateStatus").mockImplementationOnce(async (id, status) => {
      shutdown.abort();
      return updateStatus(id, status);
    });

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id], {
        shutdownSignal: shutdown.signal,
      }),
    ).rejects.toThrow(ShutdownInterruptError);

    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "queued" });
  }, 60_000);

  test("fails the group when a failed upload cannot be recorded, so the job is retried", async ({
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

    vi.spyOn(storage, "uploadFile").mockRejectedValue(new Error("storage is unreachable"));
    vi.spyOn(dbClient.snapshotLogs, "createMany").mockRejectedValue(
      new Error("database is unreachable"),
    );

    await expect(
      captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id]),
    ).rejects.toThrow("database is unreachable");
  }, 60_000);

  test("still marks a failing snapshot errored when the worker is not shutting down", async ({
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

    const shutdown = new AbortController();
    vi.spyOn(storage, "uploadFile").mockRejectedValueOnce(new Error("upload failed"));

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [first!.id, second!.id], {
      shutdownSignal: shutdown.signal,
    });

    expect(await dbClient.snapshots.findById(first!.id)).toMatchObject({ status: "error" });
    expect(await dbClient.snapshots.findById(second!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.diffs.findBySnapshot(first!.id)).toBeDefined();
  }, 60_000);
});
