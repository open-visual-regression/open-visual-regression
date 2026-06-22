import { dbClient } from "../client";
import { describe, expect, test } from "./fixtures";

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

      const updated = await dbClient.snapshots.updateStatus(snapshot!.id, "captured");
      expect(updated?.status).toBe("captured");
    });
  });

  describe("hasAllCapturedForBuild", () => {
    test("should return false while any snapshot is still pending", async ({
      build,
      captureConfiguration,
    }) => {
      const [a] = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "a" },
          { buildId: build.id, ...captureConfiguration, targetId: "b" },
        ],
      });

      await dbClient.snapshots.updateStatus(a!.id, "captured");
      expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);
    });

    test("should return true once every snapshot has been captured or errored", async ({
      build,
      captureConfiguration,
    }) => {
      const created = await dbClient.snapshots.createMany({
        values: [
          { buildId: build.id, ...captureConfiguration, targetId: "a" },
          { buildId: build.id, ...captureConfiguration, targetId: "b" },
        ],
      });

      await dbClient.snapshots.updateStatus(created[0]!.id, "captured");
      await dbClient.snapshots.updateStatus(created[1]!.id, "error");
      expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(true);
    });

    test("should return false for a build with no snapshots", async ({ build }) => {
      expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);
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
        pending: 0,
      });
    });

    test("should bucket each snapshot by its derived display status", async ({
      build,
      captureConfiguration,
    }) => {
      const [pending, passed, needsReview, rejected, capturedError] =
        await dbClient.snapshots.createMany({
          values: [
            { buildId: build.id, ...captureConfiguration, targetId: "pending" },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "passed",
              status: "captured",
            },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "needs_review",
              status: "captured",
            },
            {
              buildId: build.id,
              ...captureConfiguration,
              targetId: "rejected",
              status: "captured",
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
        processingStatus: "diffed",
        reviewStatus: "not_required",
      });
      await dbClient.diffs.create({
        snapshotId: needsReview!.id,
        processingStatus: "diffed",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: rejected!.id,
        processingStatus: "diffed",
        reviewStatus: "rejected",
      });

      expect(pending).toBeTruthy();
      expect(capturedError).toBeTruthy();

      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        passed: 1,
        approved: 0,
        needs_review: 1,
        rejected: 1,
        error: 1,
        pending: 1,
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
            status: "captured",
            hasRenderError: true,
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        processingStatus: "diffed",
        reviewStatus: "needs_review",
      });

      expect(await dbClient.snapshots.getDisplayStatusCounts(build.id)).toEqual({
        passed: 0,
        approved: 0,
        needs_review: 0,
        rejected: 0,
        error: 1,
        pending: 0,
      });
    });

    test("should count a diff processing error as 'error'", async ({
      build,
      captureConfiguration,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "diff-error" }],
      });
      await dbClient.snapshots.updateStatus(snapshot!.id, "captured");
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
        pending: 0,
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
            status: "captured",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "checkout",
            targetTitle: "Checkout Page",
            targetName: "checkout",
            status: "captured",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: passed!.id,
        processingStatus: "diffed",
        reviewStatus: "not_required",
      });
      await dbClient.diffs.create({
        snapshotId: needsReview!.id,
        processingStatus: "diffed",
        reviewStatus: "needs_review",
      });
    };

    test("filters by derived display status", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const needsReviewOnly = await dbClient.snapshots.listForBuild(build.id, {
        status: "needs_review",
        limit: 10,
        offset: 0,
      });
      expect(needsReviewOnly.map((row) => row.targetId)).toEqual(["checkout"]);
      expect(await dbClient.snapshots.countForBuild(build.id, { status: "needs_review" })).toBe(1);
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

    test("paginates results with limit and offset", async ({ build, captureConfiguration }) => {
      await seedHomeAndCheckout(build, captureConfiguration);

      const firstPage = await dbClient.snapshots.listForBuild(build.id, { limit: 1, offset: 0 });
      const secondPage = await dbClient.snapshots.listForBuild(build.id, { limit: 1, offset: 1 });
      expect(firstPage).toHaveLength(1);
      expect(secondPage).toHaveLength(1);
      expect(firstPage[0]!.id).not.toBe(secondPage[0]!.id);
      expect(await dbClient.snapshots.countForBuild(build.id)).toBe(2);
    });

    test("defaults to sorting by status priority: error, needs_review, rejected, approved, passed, then pending", async ({
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
            status: "captured",
            hasRenderError: true,
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "needs_review",
            targetTitle: "Story",
            targetName: "Story",
            status: "captured",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "rejected",
            targetTitle: "Story",
            targetName: "Story",
            status: "captured",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "approved",
            targetTitle: "Story",
            targetName: "Story",
            status: "captured",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "passed",
            targetTitle: "Story",
            targetName: "Story",
            status: "captured",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "pending",
            targetTitle: "Story",
            targetName: "Story",
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: needsReviewSnapshot!.id,
        processingStatus: "diffed",
        reviewStatus: "needs_review",
      });
      await dbClient.diffs.create({
        snapshotId: rejectedSnapshot!.id,
        processingStatus: "diffed",
        reviewStatus: "rejected",
      });
      await dbClient.diffs.create({
        snapshotId: approvedSnapshot!.id,
        processingStatus: "diffed",
        reviewStatus: "approved",
      });
      await dbClient.diffs.create({
        snapshotId: passedSnapshot!.id,
        processingStatus: "diffed",
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
        "pending",
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
});
