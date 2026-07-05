import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

const seedReviewQueue = async (build: { id: string }, captureConfiguration: object) => {
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
        passed: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 0,
        queued: 0,
        processing: 0,
      });
    });

    test("should bucket each snapshot by its derived display status", async ({
      build,
      captureConfiguration,
    }) => {
      const [queued, passed, needsReview, rejected, capturedError] =
        await dbClient.snapshots.createMany({
          values: [
            { buildId: build.id, ...captureConfiguration, targetId: "queued" },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "passed",
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
        snapshotId: passed!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
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
        passed: 1,
        approved: 0,
        needs_review: 1,
        rejected: 1,
        error: 1,
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
        passed: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
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
        passed: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
        queued: 0,
        processing: 0,
      });
    });
  });

  describe("listForBuild / countForBuild", () => {
    const seedHomeAndCheckout = async (build: { id: string }, captureConfiguration: object) => {
      const [passed, needsReview] = await dbClient.snapshots.createMany({
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
        snapshotId: passed!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
      });
      await dbClient.diffs.create({
        snapshotId: needsReview!.id,
        processingStatus: "success",
        reviewStatus: "needs_review",
      });
    };

    test("filters by derived display status", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const needsReviewOnly = await dbClient.snapshots.listForBuild(build.id, {
        statuses: ["needs_review"],
        limit: 10,
        offset: 0,
      });
      expect(needsReviewOnly.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(await dbClient.snapshots.countForBuild(build.id, { statuses: ["needs_review"] })).toBe(
        1,
      );
    });

    test("filters by more than one status", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, {
        statuses: ["needs_review", "passed"],
        limit: 10,
        offset: 0,
      });

      expect(results.map((row) => row.targetId).sort()).toEqual(["checkout", "home"]);
    });

    test("filters by search across target title and name", async ({
      build,
      captureConfiguration,
    }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const searched = await dbClient.snapshots.listForBuild(build.id, {
        search: "home",
        limit: 10,
        offset: 0,
      });
      expect(searched.map((row) => row.targetId)).toEqual(["home"]);
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
        offset: 0,
      });

      expect(results.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(await dbClient.snapshots.countForBuild(build.id, { browsers: ["firefox"] })).toBe(1);
    });

    test("filters by viewport, treating a stored height of 0 as an auto height", async ({
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
            targetId: "home",
            targetTitle: "Home Page",
            targetName: "home",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportWidth: 375,
            viewportHeight: 0,
            targetId: "checkout",
            targetTitle: "Checkout Page",
            targetName: "checkout",
          },
        ],
      });

      const results = await dbClient.snapshots.listForBuild(build.id, {
        viewports: [{ viewportWidth: 375, viewportHeight: null }],
        limit: 10,
        offset: 0,
      });

      expect(results.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(
        await dbClient.snapshots.countForBuild(build.id, {
          viewports: [{ viewportWidth: 375, viewportHeight: null }],
        }),
      ).toBe(1);
    });

    test("paginates results with limit and offset", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const firstPage = await dbClient.snapshots.listForBuild(build.id, { limit: 1, offset: 0 });
      const secondPage = await dbClient.snapshots.listForBuild(build.id, { limit: 1, offset: 1 });
      expect(firstPage).toHaveLength(1);
      expect(secondPage).toHaveLength(1);
      expect(firstPage[0]!.id).not.toBe(secondPage[0]!.id);
      expect(await dbClient.snapshots.countForBuild(build.id)).toBe(2);
    });

    test("defaults to sorting by status priority: error, needs_review, rejected, approved, passed, then queued", async ({
      build,
      captureConfiguration,
    }) => {
      const [
        errorSnapshot,
        needsReviewSnapshot,
        rejectedSnapshot,
        approvedSnapshot,
        passedSnapshot,
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
            targetId: "passed",
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
        snapshotId: passedSnapshot!.id,
        processingStatus: "success",
        reviewStatus: "not_required",
      });

      expect(errorSnapshot).toBeTruthy();

      const results = await dbClient.snapshots.listForBuild(build.id, { limit: 10, offset: 0 });
      expect(results.map((row) => row.targetId)).toEqual([
        "error",
        "needs_review",
        "rejected",
        "approved",
        "passed",
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

      const results = await dbClient.snapshots.listForBuild(build.id, { limit: 10, offset: 0 });
      expect(results.map((row) => row.targetId)).toEqual(["checkout", "home"]);
    });

    const createSortableRows = (build: { id: string }, captureConfiguration: object) =>
      dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            browser: "chromium",
            viewportWidth: 1920,
            targetId: "row-b-title",
            targetTitle: "B",
            targetName: "a",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            browser: "webkit",
            viewportWidth: 375,
            targetId: "row-a-title",
            targetTitle: "A",
            targetName: "z",
          },
        ],
      });

    test("sorts by targetName when requested", async ({ build, captureConfiguration }) => {
      await createSortableRows(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, {
        sortBy: [{ column: "targetName", direction: "asc" }],
        limit: 10,
        offset: 0,
      });
      expect(results.map((row) => row.targetId)).toEqual(["row-b-title", "row-a-title"]);
    });

    test("sorts by browser when requested", async ({ build, captureConfiguration }) => {
      await createSortableRows(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, {
        sortBy: [{ column: "browser", direction: "asc" }],
        limit: 10,
        offset: 0,
      });
      expect(results.map((row) => row.targetId)).toEqual(["row-b-title", "row-a-title"]);
    });

    test("sorts by viewportWidth when requested", async ({ build, captureConfiguration }) => {
      await createSortableRows(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, {
        sortBy: [{ column: "viewportWidth", direction: "asc" }],
        limit: 10,
        offset: 0,
      });
      expect(results.map((row) => row.targetId)).toEqual(["row-a-title", "row-b-title"]);
    });

    test("reverses order when direction is desc", async ({ build, captureConfiguration }) => {
      await createSortableRows(build, captureConfiguration);

      const results = await dbClient.snapshots.listForBuild(build.id, {
        sortBy: [{ column: "targetTitle", direction: "desc" }],
        limit: 10,
        offset: 0,
      });
      expect(results.map((row) => row.targetId)).toEqual(["row-b-title", "row-a-title"]);
    });
  });

  describe("findViewports", () => {
    test("returns the distinct viewports for a build, ordered by width then height", async ({
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
            targetId: "home",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportWidth: 1280,
            viewportHeight: 800,
            targetId: "checkout",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            viewportWidth: 375,
            viewportHeight: 0,
            targetId: "mobile-home",
          },
        ],
      });

      const viewports = await dbClient.snapshots.findViewports(build.id);

      expect(viewports).toEqual([
        { viewportWidth: 375, viewportHeight: null },
        { viewportWidth: 1280, viewportHeight: 800 },
      ]);
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

      const results = await dbClient.snapshots.listForBuild(build.id, { limit: 10, offset: 0 });
      expect(results.map((row) => row.targetId)).toEqual(["d", "a", "b", "c"]);
      expect(results.map((row) => row.status)).toEqual([
        "error",
        "needs_review",
        "rejected",
        "passed",
      ]);
    });

    test("preserves position when status changes within the same priority tier", async ({
      build,
      captureConfiguration,
    }) => {
      const { first } = await seedReviewQueue(build, captureConfiguration);

      const before = await dbClient.snapshots.listForBuild(build.id, { limit: 10, offset: 0 });
      expect(before.map((row) => row.targetId)).toEqual(["d", "a", "b", "c"]);

      const diff = await dbClient.diffs.findBySnapshot(first.id);
      await dbClient.diffs.updateReviewStatus(diff!.id, "approved");

      const after = await dbClient.snapshots.listForBuild(build.id, { limit: 10, offset: 0 });
      expect(after.map((row) => row.targetId)).toEqual(["d", "a", "b", "c"]);
    });
  });
});
