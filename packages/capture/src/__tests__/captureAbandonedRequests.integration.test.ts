import { readFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { captureBuildGroup } from "../snapshots";
import { describe, expect, test, uploadArtifactWithIframe } from "./fixtures";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const IFRAME_HTML = await readFile(path.join(TEST_DIR, "html/iframe-static.html"), "utf-8");

let server: http.Server;
let stuckImageUrl: string;

beforeAll(async () => {
  // Sends the headers, then never sends the image.
  server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.flushHeaders();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  stuckImageUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/stuck.png`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const iframeWithStuckImage = () =>
  IFRAME_HTML.replace(
    'for (const listener of this._l["storyRendered"] || []) {',
    `const image = document.createElement("img");
          image.src = "${stuckImageUrl}";
          document.getElementById("storybook-root").append(image);
          for (const listener of this._l["storyRendered"] || []) {`,
  );

describe("captureBuildGroup", () => {
  test("warns which request a snapshot was captured without and counts it", async ({
    mainBuild,
    captureConfiguration,
    metrics,
  }) => {
    vi.stubEnv("OVR_CAPTURE_REQUEST_TIMEOUT_MS", "1000");
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithStuckImage());
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
    });

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

    expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({ status: "success" });
    expect(await dbClient.snapshotLogs.findBySnapshot(snapshot!.id)).toContainEqual(
      expect.objectContaining({
        level: "warning",
        message: expect.stringMatching(/never finished loading.*stuck\.png/),
      }),
    );
    expect(await metrics.scrape()).toContain("ovr_capture_requests_abandoned_total 1");
  }, 30_000);

  test("stops waiting for a request that never finishes after OVR_CAPTURE_REQUEST_TIMEOUT_MS", async ({
    mainBuild,
    captureConfiguration,
    metrics,
  }) => {
    vi.stubEnv("OVR_CAPTURE_REQUEST_TIMEOUT_MS", "1000");
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithStuckImage());
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
    });

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

    expect(await metrics.scrape()).toContain(
      'ovr_snapshot_capture_phase_duration_seconds_bucket{browser="chromium",phase="settle",le="2.5"} 1',
    );
  }, 30_000);

  test("stops waiting for a request that never finishes after 5 seconds by default", async ({
    mainBuild,
    captureConfiguration,
    metrics,
  }) => {
    await uploadArtifactWithIframe(mainBuild.artifactPath, iframeWithStuckImage());
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
    });

    await captureBuildGroup(mainBuild.id, captureConfiguration.browser, [snapshot!.id]);

    const body = await metrics.scrape();
    expect(body).toContain(
      'ovr_snapshot_capture_phase_duration_seconds_bucket{browser="chromium",phase="settle",le="2.5"} 0',
    );
    expect(body).toContain(
      'ovr_snapshot_capture_phase_duration_seconds_bucket{browser="chromium",phase="settle",le="10"} 1',
    );
  }, 30_000);
});
