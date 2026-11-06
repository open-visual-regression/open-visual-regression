import { readFile } from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, vi } from "vitest";

import { dbClient } from "@ovr/db/client";

import { captureBuildGroup } from "../snapshots";
import { describe, expect, test, uploadArtifactWithIframe } from "./fixtures";

// A short budget, so a request that never finishes is given up on quickly.
vi.mock("@ovr/capture-browser/timeouts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ovr/capture-browser/timeouts")>()),
  SETTLE_TIMEOUT_MS: 2_000,
}));

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
});
