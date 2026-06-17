import { vi } from "vitest";

import { describe, expect, test } from "vitest";

const dbClient = {
  snapshots: {
    findById: vi.fn(),
    findByBuild: vi.fn(),
    updateCaptureResult: vi.fn(),
    hasAllCapturedForBuild: vi.fn(),
  },
  builds: { findById: vi.fn() },
  captureConfigurations: { findById: vi.fn() },
  snapshotLogs: { createMany: vi.fn() },
  diffs: { create: vi.fn() },
};

const storage = {
  getFileStream: vi.fn().mockRejectedValue(new Error("not found")),
  uploadFile: vi.fn(),
};

const enqueueDiff = vi.fn();
const enqueueFinalize = vi.fn();

vi.mock("@ovr/db/client", () => ({ dbClient }));
vi.mock("@ovr/storage", () => ({ storage }));
vi.mock("../lib/queue", () => ({ enqueueDiff, enqueueFinalize }));

let routeCallback: ((route: unknown) => unknown) | undefined;
const page = {
  on: vi.fn(),
  route: vi.fn((_pattern: string, callback: (route: unknown) => unknown) => {
    routeCallback = callback;
  }),
  goto: vi.fn().mockResolvedValue(undefined),
  waitForSelector: vi.fn().mockResolvedValue(undefined),
  evaluate: vi.fn().mockResolvedValue({ ok: true }),
  screenshot: vi.fn().mockResolvedValue(Buffer.from("png-bytes")),
};
const context = { newPage: vi.fn().mockResolvedValue(page) };
const browser = { newContext: vi.fn().mockResolvedValue(context), close: vi.fn() };
const launch = vi.fn().mockResolvedValue(browser);

vi.mock("playwright", () => ({ chromium: { launch } }));

const { captureSnapshot } = await import("../snapshots");

const SNAPSHOT_ID = "snapshot-1";
const BUILD_ID = "build-1";

const snapshotRow = {
  id: SNAPSHOT_ID,
  buildId: BUILD_ID,
  captureConfigurationId: "config-1",
  targetId: "story-a",
  status: "pending" as const,
  imagePath: null,
  hasRenderError: false,
};

describe("captureSnapshot", () => {
  test("captures a screenshot, stores logs, marks captured, and enqueues diffs when last in build", async () => {
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue({ id: BUILD_ID, projectId: "project-1" });
    dbClient.captureConfigurations.findById.mockResolvedValue({
      viewportWidth: 1280,
      viewportHeight: 800,
    });
    dbClient.snapshots.hasAllCapturedForBuild.mockResolvedValue(true);
    dbClient.snapshots.findByBuild.mockResolvedValue([snapshotRow]);
    dbClient.diffs.create.mockResolvedValue({ id: "diff-1" });
    page.evaluate.mockResolvedValueOnce({ ok: true });

    await captureSnapshot(SNAPSHOT_ID);

    expect(storage.uploadFile).toHaveBeenCalledWith(
      `builds/${BUILD_ID}/snapshots/${SNAPSHOT_ID}.png`,
      expect.any(Buffer),
      "image/png",
    );
    expect(dbClient.snapshots.updateCaptureResult).toHaveBeenCalledWith(SNAPSHOT_ID, {
      status: "captured",
      imagePath: `builds/${BUILD_ID}/snapshots/${SNAPSHOT_ID}.png`,
      hasRenderError: false,
    });
    expect(dbClient.diffs.create).toHaveBeenCalledWith({ snapshotId: SNAPSHOT_ID });
    expect(enqueueDiff).toHaveBeenCalledWith({ snapshotId: SNAPSHOT_ID, diffId: "diff-1" });
  });

  test("marks hasRenderError when the story fails to render, but status is still captured", async () => {
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue({ id: BUILD_ID, projectId: "project-1" });
    dbClient.captureConfigurations.findById.mockResolvedValue({
      viewportWidth: 1280,
      viewportHeight: 800,
    });
    dbClient.snapshots.hasAllCapturedForBuild.mockResolvedValue(false);
    page.evaluate.mockResolvedValueOnce({ ok: false, error: "play function threw" });

    await captureSnapshot(SNAPSHOT_ID);

    expect(dbClient.snapshots.updateCaptureResult).toHaveBeenCalledWith(
      SNAPSHOT_ID,
      expect.objectContaining({ status: "captured", hasRenderError: true }),
    );
    expect(dbClient.snapshotLogs.createMany).toHaveBeenCalledWith({
      values: [{ snapshotId: SNAPSHOT_ID, level: "error", message: "play function threw" }],
    });
  });

  test("does not enqueue diff jobs when not the last capture in the build", async () => {
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue({ id: BUILD_ID, projectId: "project-1" });
    dbClient.captureConfigurations.findById.mockResolvedValue({
      viewportWidth: 1280,
      viewportHeight: 800,
    });
    dbClient.snapshots.hasAllCapturedForBuild.mockResolvedValue(false);
    page.evaluate.mockResolvedValueOnce({ ok: true });

    await captureSnapshot(SNAPSHOT_ID);

    expect(dbClient.diffs.create).not.toHaveBeenCalled();
    expect(enqueueDiff).not.toHaveBeenCalled();
  });

  test("route handler allows the storybook origin and data/blob urls, aborts everything else", async () => {
    dbClient.snapshots.findById.mockResolvedValue(snapshotRow);
    dbClient.builds.findById.mockResolvedValue({ id: BUILD_ID, projectId: "project-1" });
    dbClient.captureConfigurations.findById.mockResolvedValue({
      viewportWidth: 1280,
      viewportHeight: 800,
    });
    dbClient.snapshots.hasAllCapturedForBuild.mockResolvedValue(false);
    page.evaluate.mockResolvedValueOnce({ ok: true });

    await captureSnapshot(SNAPSHOT_ID);

    const storybookOrigin = (page.goto.mock.calls.at(-1)![0] as string).replace("/iframe.html", "");
    const makeRoute = (url: string) => ({
      request: () => ({ url: () => url }),
      continue: vi.fn(),
      abort: vi.fn(),
    });

    const sameOrigin = makeRoute(`${storybookOrigin}/runtime.js`);
    routeCallback!(sameOrigin);
    expect(sameOrigin.continue).toHaveBeenCalled();
    expect(sameOrigin.abort).not.toHaveBeenCalled();

    const dataUrl = makeRoute("data:text/plain;base64,aGk=");
    routeCallback!(dataUrl);
    expect(dataUrl.continue).toHaveBeenCalled();

    const thirdParty = makeRoute("https://evil.example/tracker.js");
    routeCallback!(thirdParty);
    expect(thirdParty.abort).toHaveBeenCalled();
    expect(thirdParty.continue).not.toHaveBeenCalled();
  });
});
