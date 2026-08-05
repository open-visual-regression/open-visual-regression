import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

const seedReviewQueue = async (
  build: { id: string },
  captureConfiguration: {
    browser: string;
    viewportWidth: number;
    viewportHeight: number;
    viewportName: string;
  },
) => {
  const [first, second, noDiff, errored] = await dbClient.snapshots.createMany({
    values: [
      {
        buildId: build.id,
        ...captureConfiguration,
        targetId: "a",
        targetTitle: "A",
        status: "success",
      },
      {
        buildId: build.id,
        ...captureConfiguration,
        targetId: "b",
        targetTitle: "B",
        status: "success",
      },
      {
        buildId: build.id,
        ...captureConfiguration,
        targetId: "c",
        targetTitle: "C",
        status: "success",
      },
      {
        buildId: build.id,
        ...captureConfiguration,
        targetId: "d",
        targetTitle: "D",
        status: "error",
        hasRenderError: true,
      },
    ],
  });

  await dbClient.diffs.create({
    snapshotId: first!.id,
    processingStatus: "success",
    reviewStatus: "needs_review",
  });
  await dbClient.diffs.create({
    snapshotId: second!.id,
    processingStatus: "success",
    reviewStatus: "rejected",
  });
  await dbClient.diffs.create({
    snapshotId: noDiff!.id,
    processingStatus: "success",
    reviewStatus: "not_required",
  });

  return { first: first!, second: second!, noDiff: noDiff!, errored: errored! };
};

describe("snapshots", () => {
  describe("createMany", () => {
    test("should create a snapshot for each input row", async ({ build, captureConfiguration }) => {
      const created = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--secondary",
          },
        ],
      });

      expect(created).toHaveLength(2);
    });
  });

  describe("findByBuild", () => {
    test("should return all snapshots belonging to the build", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--secondary",
          },
        ],
      });

      const found = await dbClient.snapshots.findByBuild(build.id);
      expect(found).toHaveLength(2);
    });
  });

  describe("countByBuild", () => {
    test("should return the number of snapshots belonging to the build", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--secondary",
          },
        ],
      });

      expect(await dbClient.snapshots.countByBuild(build.id)).toBe(2);
    });
  });

  describe("updateStatus", () => {
    test("should update a snapshot's status", async ({ build, captureConfiguration }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "a" }],
      });

      const updated = await dbClient.snapshots.updateStatus(snapshot!.id, "success");
      expect(updated?.status).toBe("success");
    });
  });

  describe("getDisplayStatusCounts", () => {
    test("should return zero counts for a build with no snapshots", async ({ build }) => {
      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        canceled: 0,
        queued: 0,
        processing: 0,
      });
    });

    test("should bucket each snapshot by its derived display status", async ({
      build,
      captureConfiguration,
    }) => {
      const [queued, unchanged, autoApproved, needsReview, rejected, capturedError] =
        await dbClient.snapshots.createMany({
          values: [
            { buildId: build.id, ...captureConfiguration, targetId: "queued" },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "unchanged",
              status: "success",
            },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "auto_approved",
              status: "success",
            },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "needs_review",
              status: "success",
            },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "rejected",
              status: "success",
            },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "captured-error",
              status: "error",
            },
          ],
        });

      await dbClient.diffs.create({
        snapshotId: unchanged!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 0,
      });
      await dbClient.diffs.create({
        snapshotId: autoApproved!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
        pixelDiffCount: 128,
        diffPercent: 5,
      });
      await dbClient.diffs.create({
        snapshotId: needsReview!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: rejected!.id,
        processingStatus: "success",
        reviewStatus: "rejected",
      });

      expect(queued).toBeTruthy();
      expect(capturedError).toBeTruthy();

      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        unchanged: 1,
        auto_approved: 1,
        approved: 0,
        needs_review: 1,
        rejected: 1,
        error: 1,
        canceled: 0,
        queued: 1,
        processing: 0,
      });
    });

    test("should count a render-errored snapshot as 'error' even when its diff needs review", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "rendered-but-broken",
            status: "success",
            hasRenderError: true,
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
        canceled: 0,
        queued: 0,
        processing: 0,
      });
    });

    test("should count a diff processing error as 'error'", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "diff-error" }],
      });
      await dbClient.snapshots.updateStatus(snapshot!.id, "success");
      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "error",
        reviewStatus: "not_required",
      });

      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
        canceled: 0,
        queued: 0,
        processing: 0,
      });
    });

    test("should count canceled snapshots and diffs as 'canceled'", async ({
      build,
      captureConfiguration,
    }) => {
      const [canceledSnapshot, canceledDiffSnapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "canceled", status: "canceled" },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "canceled-diff",
            status: "success",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: canceledDiffSnapshot!.id,
        processingStatus: "canceled",
        reviewStatus: "not_required",
      });

      expect(canceledSnapshot).toBeTruthy();

      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        unchanged: 0,
        auto_approved: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        canceled: 2,
        queued: 0,
        processing: 0,
      });
    });
  });

  describe("markUnfinishedAs", () => {
    test("transitions queued and processing snapshots but leaves completed ones untouched", async ({
      build,
      captureConfiguration,
    }) => {
      const [queued, processing, success, errored] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "queued", status: "queued" },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "processing",
            status: "processing",
          },
          { buildId: build.id, ...captureConfiguration, targetId: "success", status: "success" },
          { buildId: build.id, ...captureConfiguration, targetId: "error", status: "error" },
        ],
      });

      await dbClient.snapshots.markUnfinishedAs(build.id, "canceled");

      expect(await dbClient.snapshots.findById(queued!.id)).toMatchObject({ status: "canceled" });
      expect(await dbClient.snapshots.findById(processing!.id)).toMatchObject({
        status: "canceled",
      });
      expect(await dbClient.snapshots.findById(success!.id)).toMatchObject({ status: "success" });
      expect(await dbClient.snapshots.findById(errored!.id)).toMatchObject({ status: "error" });
    });
  });

  describe("updateCaptureResult", () => {
    test("does not overwrite a snapshot canceled while its capture was in flight", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "canceled", status: "canceled" },
        ],
      });

      const updated = await dbClient.snapshots.updateCaptureResult(snapshot!.id, {
        status: "success",
        imagePath: "some/path.png",
        hasRenderError: false,
      });

      expect(updated).toBeUndefined();
      expect(await dbClient.snapshots.findById(snapshot!.id)).toMatchObject({ status: "canceled" });
    });
  });

  describe("listForBuild / countForBuild", () => {
    const seedHomeAndCheckout = async (
      build: { id: string },
      captureConfiguration: {
        browser: string;
        viewportWidth: number;
        viewportHeight: number;
        viewportName: string;
      },
    ) => {
      const [unchanged, needsReview] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "home",
            targetTitle: "Home Page",
            targetName: "home",
            status: "success",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "checkout",
            targetTitle: "Checkout Page",
            targetName: "checkout",
            status: "success",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: unchanged!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
      });
      await dbClient.diffs.create({
        snapshotId: needsReview!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
    };

    const seedStories = (
      build: { id: string },
      captureConfiguration: {
        browser: string;
        viewportWidth: number;
        viewportHeight: number;
        viewportName: string;
      },
      count: number,
    ) =>
      dbClient.snapshots.createMany({
        values: Array.from({ length: count }, (_, index) => ({
          buildId: build.id,
          ...captureConfiguration,
          targetId: `story-${index}`,
          targetTitle: `Story ${index}`,
          targetName: `story-${index}`,
          status: "success" as const,
        })),
      });

    test("filters by derived display status", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const needsReviewOnly = await dbClient.snapshots.listForBuild(build.id, {
        statuses: ["needs_review"],
        limit: 10,
      });
      expect(needsReviewOnly.snapshots.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(await dbClient.snapshots.countForBuild(build.id, { statuses: ["needs_review"] })).toBe(
        1,
      );
    });

    test("filters by more than one status", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, {
        statuses: ["needs_review", "unchanged"],
        limit: 10,
      });

      expect(results.snapshots.map((row) => row.targetId).sort()).toEqual(["checkout", "home"]);
    });

    test("filters by search across target title and name", async ({
      build,
      captureConfiguration,
    }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const searched = await dbClient.snapshots.listForBuild(build.id, {
        search: "home",
        limit: 10,
      });
      expect(searched.snapshots.map((row) => row.targetId)).toEqual(["home"]);
    });

    test("filters by browser", async ({ build, captureConfiguration }) => {
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            browser: "chromium",
            targetId: "home",
            targetTitle: "Home Page",
            targetName: "home",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            browser: "firefox",
            targetId: "checkout",
            targetTitle: "Checkout Page",
            targetName: "checkout",
          },
        ],
      });

      const results = await dbClient.snapshots.listForBuild(build.id, {
        browsers: ["firefox"],
        limit: 10,
      });

      expect(results.snapshots.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(await dbClient.snapshots.countForBuild(build.id, { browsers: ["firefox"] })).toBe(1);
    });

    test("filters by viewport name", async ({ build, captureConfiguration }) => {
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportName: "desktop",
            targetId: "home",
            targetTitle: "Home Page",
            targetName: "home",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportName: "mobile",
            targetId: "checkout",
            targetTitle: "Checkout Page",
            targetName: "checkout",
          },
        ],
      });

      const results = await dbClient.snapshots.listForBuild(build.id, {
        viewports: ["mobile"],
        limit: 10,
      });

      expect(results.snapshots.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(await dbClient.snapshots.countForBuild(build.id, { viewports: ["mobile"] })).toBe(1);
    });

    test("pages through results with a cursor", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const firstPage = await dbClient.snapshots.listForBuild(build.id, { limit: 1 });
      expect(firstPage.snapshots).toHaveLength(1);
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await dbClient.snapshots.listForBuild(build.id, {
        limit: 1,
        cursor: firstPage.nextCursor ?? undefined,
      });
      expect(secondPage.snapshots).toHaveLength(1);
      expect(secondPage.snapshots[0]!.id).not.toBe(firstPage.snapshots[0]!.id);

      expect(secondPage.nextCursor).toBeNull();
      expect(await dbClient.snapshots.countForBuild(build.id)).toBe(2);
    });

    test("defaults to sorting by status priority: error, needs_review, rejected, approved, unchanged, then queued", async ({
      build,
      captureConfiguration,
    }) => {
      const [
        errorSnapshot,
        needsReviewSnapshot,
        rejectedSnapshot,
        approvedSnapshot,
        unchangedSnapshot,
      ] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "error",
            targetTitle: "Story",
            targetName: "Story",
            status: "success",
            hasRenderError: true,
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "needs_review",
            targetTitle: "Story",
            targetName: "Story",
            status: "success",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "rejected",
            targetTitle: "Story",
            targetName: "Story",
            status: "success",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "approved",
            targetTitle: "Story",
            targetName: "Story",
            status: "success",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "unchanged",
            targetTitle: "Story",
            targetName: "Story",
            status: "success",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "queued",
            targetTitle: "Story",
            targetName: "Story",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: needsReviewSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: rejectedSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "rejected",
      });
      await dbClient.diffs.create({
        snapshotId: approvedSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "approved",
      });
      await dbClient.diffs.create({
        snapshotId: unchangedSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
      });

      expect(errorSnapshot).toBeTruthy();

      const results = await dbClient.snapshots.listForBuild(build.id, { limit: 10 });
      expect(results.snapshots.map((row) => row.targetId)).toEqual([
        "error",
        "needs_review",
        "rejected",
        "approved",
        "unchanged",
        "queued",
      ]);
    });

    test("falls back to target title when status priority is tied", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "home",
            targetTitle: "Home Page",
            targetName: "home",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "checkout",
            targetTitle: "Checkout Page",
            targetName: "checkout",
          },
        ],
      });

      const results = await dbClient.snapshots.listForBuild(build.id, { limit: 10 });
      expect(results.snapshots.map((row) => row.targetId)).toEqual(["checkout", "home"]);
    });

    test("returns every snapshot exactly once across pages", async ({
      build,
      captureConfiguration,
    }) => {
      await seedStories(build, captureConfiguration, 5);

      const first = await dbClient.snapshots.listForBuild(build.id, { limit: 2 });
      const second = await dbClient.snapshots.listForBuild(build.id, {
        limit: 2,
        cursor: first.nextCursor ?? undefined,
      });
      const third = await dbClient.snapshots.listForBuild(build.id, {
        limit: 2,
        cursor: second.nextCursor ?? undefined,
      });

      expect(first.snapshots.map((row) => row.targetId)).toEqual(["story-0", "story-1"]);
      expect(second.snapshots.map((row) => row.targetId)).toEqual(["story-2", "story-3"]);
      expect(third.snapshots.map((row) => row.targetId)).toEqual(["story-4"]);
      expect(third.nextCursor).toBeNull();
    });

    test("keeps paging correct when every sort key ties", async ({
      build,
      captureConfiguration,
    }) => {
      const created = await dbClient.snapshots.createMany({
        values: Array.from({ length: 4 }, () => ({
          buildId: build.id,
          ...captureConfiguration,
          targetId: "same",
          targetTitle: "Same",
          targetName: "same",
        })),
      });

      const first = await dbClient.snapshots.listForBuild(build.id, { limit: 2 });
      const second = await dbClient.snapshots.listForBuild(build.id, {
        limit: 2,
        cursor: first.nextCursor ?? undefined,
      });

      const paged = [...first.snapshots, ...second.snapshots].map((row) => row.id);
      expect(paged).toEqual(created.map((snapshot) => snapshot.id).sort());
      expect(second.nextCursor).toBeNull();
    });

    test("does not drop or duplicate a row when a snapshot is reviewed mid-scroll", async ({
      build,
      captureConfiguration,
    }) => {
      const created = await seedStories(build, captureConfiguration, 4);
      for (const snapshot of created) {
        await dbClient.diffs.create({
          snapshotId: snapshot.id,
          processingStatus: "success",
          reviewStatus: "needs_review",
        });
      }

      const first = await dbClient.snapshots.listForBuild(build.id, { limit: 2 });

      const diff = await dbClient.diffs.findBySnapshot(first.snapshots[0]!.id);
      await dbClient.diffs.updateReviewStatus(diff!.id, "approved");

      const second = await dbClient.snapshots.listForBuild(build.id, {
        limit: 2,
        cursor: first.nextCursor ?? undefined,
      });

      expect([...first.snapshots, ...second.snapshots].map((row) => row.targetId)).toEqual([
        "story-0",
        "story-1",
        "story-2",
        "story-3",
      ]);
    });

    test("misses a snapshot promoted above the cursor while the build is processing", async ({
      build,
      captureConfiguration,
    }) => {
      const created = await dbClient.snapshots.createMany({
        values: Array.from({ length: 4 }, (_, index) => ({
          buildId: build.id,
          ...captureConfiguration,
          targetId: `story-${index}`,
          targetTitle: `Story ${index}`,
          targetName: `story-${index}`,
        })),
      });

      const first = await dbClient.snapshots.listForBuild(build.id, { limit: 2 });

      const promoted = created.at(-1)!;
      await dbClient.snapshots.updateStatus(promoted.id, "success");
      await dbClient.diffs.create({
        snapshotId: promoted.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const second = await dbClient.snapshots.listForBuild(build.id, {
        limit: 2,
        cursor: first.nextCursor ?? undefined,
      });

      expect([...first.snapshots, ...second.snapshots].map((row) => row.id)).not.toContain(
        promoted.id,
      );

      const restarted = await dbClient.snapshots.listForBuild(build.id, { limit: 2 });
      expect(restarted.snapshots.map((row) => row.id)).toContain(promoted.id);
    });
  });

  describe("findStatuses", () => {
    test("returns the distinct derived display statuses present in the build", async ({
      build,
      captureConfiguration,
    }) => {
      await seedReviewQueue(build, captureConfiguration);

      const statuses = await dbClient.snapshots.findStatuses(build.id);

      expect(statuses.sort()).toEqual(["error", "needs_review", "rejected", "unchanged"]);
    });
  });

  describe("findBrowsers", () => {
    test("returns the distinct browsers present in the build, ordered", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, browser: "firefox", targetId: "a" },
          { buildId: build.id, ...captureConfiguration, browser: "chromium", targetId: "b" },
          { buildId: build.id, ...captureConfiguration, browser: "chromium", targetId: "c" },
        ],
      });

      const browsers = await dbClient.snapshots.findBrowsers(build.id);

      expect(browsers).toEqual(["chromium", "firefox"]);
    });
  });

  describe("findViewports", () => {
    test("returns the distinct viewport names for a build, ordered by width", async ({
      build,
      captureConfiguration,
    }) => {
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportWidth: 1280,
            viewportHeight: 800,
            viewportName: "desktop",
            targetId: "home",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportWidth: 1280,
            viewportHeight: 800,
            viewportName: "desktop",
            targetId: "checkout",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportWidth: 375,
            viewportHeight: 0,
            viewportName: "mobile",
            targetId: "mobile-home",
          },
        ],
      });

      const viewports = await dbClient.snapshots.findViewports(build.id);

      expect(viewports).toEqual(["mobile", "desktop"]);
    });
  });

  describe("findAdjacentReviewableIds", () => {
    test("returns the next reviewable id in sort order", async ({
      build,
      captureConfiguration,
    }) => {
      const { first, second } = await seedReviewQueue(build, captureConfiguration);

      const result = await dbClient.snapshots.findAdjacentReviewableIds(build.id, first.id);
      expect(result).toEqual({ prevId: null, nextId: second.id, position: 1, total: 2 });
    });

    test("returns the previous reviewable id in sort order", async ({
      build,
      captureConfiguration,
    }) => {
      const { first, second } = await seedReviewQueue(build, captureConfiguration);

      const result = await dbClient.snapshots.findAdjacentReviewableIds(build.id, second.id);
      expect(result).toEqual({ prevId: first.id, nextId: null, position: 2, total: 2 });
    });

    test("returns nulls for a snapshot that does not require review", async ({
      build,
      captureConfiguration,
    }) => {
      const { noDiff } = await seedReviewQueue(build, captureConfiguration);

      const result = await dbClient.snapshots.findAdjacentReviewableIds(build.id, noDiff.id);
      expect(result).toEqual({ prevId: null, nextId: null, position: null, total: null });
    });

    test("excludes errored snapshots even when their diff needs review", async ({
      build,
      captureConfiguration,
    }) => {
      const { second, errored } = await seedReviewQueue(build, captureConfiguration);
      await dbClient.diffs.create({
        snapshotId: errored.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const result = await dbClient.snapshots.findAdjacentReviewableIds(build.id, second.id);
      expect(result.nextId).toBeNull();
    });

    test("preserves position when status changes within the same priority tier", async ({
      build,
      captureConfiguration,
    }) => {
      const { first, second } = await seedReviewQueue(build, captureConfiguration);
      const diff = await dbClient.diffs.findBySnapshot(first.id);

      const before = await dbClient.snapshots.findAdjacentReviewableIds(build.id, first.id);
      expect(before).toEqual({ prevId: null, nextId: second.id, position: 1, total: 2 });

      await dbClient.diffs.updateReviewStatus(diff!.id, "approved");

      const after = await dbClient.snapshots.findAdjacentReviewableIds(build.id, first.id);
      expect(after).toEqual({ prevId: null, nextId: second.id, position: 1, total: 2 });
    });
  });

  describe("listForBuild default sort", () => {
    test("orders by status tier before title/name/browser/viewport", async ({
      build,
      captureConfiguration,
    }) => {
      await seedReviewQueue(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, { limit: 10 });
      expect(results.snapshots.map((row) => row.targetId)).toEqual(["d", "a", "b", "c"]);
      expect(results.snapshots.map((row) => row.status)).toEqual([
        "error",
        "needs_review",
        "rejected",
        "unchanged",
      ]);
    });

    test("preserves position when status changes within the same priority tier", async ({
      build,
      captureConfiguration,
    }) => {
      const { first } = await seedReviewQueue(build, captureConfiguration);

      const before = await dbClient.snapshots.listForBuild(build.id, { limit: 10 });
      expect(before.snapshots.map((row) => row.targetId)).toEqual(["d", "a", "b", "c"]);

      const diff = await dbClient.diffs.findBySnapshot(first.id);
      await dbClient.diffs.updateReviewStatus(diff!.id, "approved");

      const after = await dbClient.snapshots.listForBuild(build.id, { limit: 10 });
      expect(after.snapshots.map((row) => row.targetId)).toEqual(["d", "a", "b", "c"]);
    });
  });
});
