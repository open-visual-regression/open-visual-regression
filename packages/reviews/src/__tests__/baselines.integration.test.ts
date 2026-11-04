import { dbClient } from "@ovr/db/client";

import { findComparisonBaseline, getBaseline, promoteBaseline } from "../baselines";
import { describe, expect, test } from "./fixtures";

describe("baselines", () => {
  describe("getBaseline", () => {
    test("should have nothing to compare a story against until a reviewer has approved one", async ({
      project,
      captureConfiguration,
    }) => {
      const result = await getBaseline(project.id, captureConfiguration, "story-a");

      expect(result).toBeUndefined();
    });

    test("should compare future stories against the one a reviewer most recently approved", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        snapshotId: snapshot!.id,
        approvedBy: reviewer.id,
      });

      const result = await getBaseline(project.id, captureConfiguration, "story-a");

      expect(result).toMatchObject({ snapshotId: snapshot!.id });
    });
  });

  describe("promoteBaseline", () => {
    test("should let a reviewer's approval set the new baseline when the build is on the project's default branch", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild.id,
            ...captureConfiguration,
            targetId: "story-a",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await promoteBaseline(diff!.id, reviewer.id);

      const baseline = await getBaseline(project.id, captureConfiguration, "story-a");
      expect(baseline).toMatchObject({ snapshotId: snapshot!.id, approvedBy: reviewer.id });
    });

    test("should not let an approval on a feature branch change what future stories are compared against", async ({
      project,
      captureConfiguration,
      reviewer,
    }) => {
      const featureBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "feature/x",
        commitSha: "b".repeat(40),
        artifactPath: "builds/feature/artifact",
        createdBy: reviewer.id,
      });
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: featureBuild!.id,
            ...captureConfiguration,
            targetId: "story-b",
          },
        ],
      });
      const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });

      await promoteBaseline(diff!.id, reviewer.id);

      const baseline = await getBaseline(project.id, captureConfiguration, "story-b");
      expect(baseline).toBeUndefined();
      expect(
        await dbClient.baselineRevisions.findFirstAfter(
          { projectId: project.id, ...captureConfiguration, targetId: "story-b" },
          "2000-01-01T00:00:00.000Z",
        ),
      ).toBeUndefined();
    });

    test("should remember what a target looked like before main changed it", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [previous, changed] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "target-a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "target-a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: changed!.id,
        baselineSnapshotId: previous!.id,
        reviewStatus: "auto_approved",
      });

      await promoteBaseline(diff!.id, reviewer.id);

      const revision = await dbClient.baselineRevisions.findFirstAfter(
        { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
        "2000-01-01T00:00:00.000Z",
      );
      expect(revision).toMatchObject({
        buildId: mainBuild.id,
        previousSnapshotId: previous!.id,
        replacedExisting: true,
        createdAt: mainBuild.createdAt,
      });
    });

    test("should remember that a target added on main had no baseline before", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "target-a" }],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        reviewStatus: "auto_approved",
      });

      await promoteBaseline(diff!.id, reviewer.id);

      const revision = await dbClient.baselineRevisions.findFirstAfter(
        { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
        "2000-01-01T00:00:00.000Z",
      );
      expect(revision).toMatchObject({ previousSnapshotId: null, replacedExisting: false });
    });

    test("should not record a change for a target main left unchanged", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [previous, unchanged] = await dbClient.snapshots.createMany({
        values: [
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "target-a" },
          { buildId: mainBuild.id, ...captureConfiguration, targetId: "target-a" },
        ],
      });
      const diff = await dbClient.diffs.create({
        snapshotId: unchanged!.id,
        baselineSnapshotId: previous!.id,
        reviewStatus: "unchanged",
      });

      await promoteBaseline(diff!.id, reviewer.id);

      expect(
        await dbClient.baselineRevisions.findFirstAfter(
          { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
          "2000-01-01T00:00:00.000Z",
        ),
      ).toBeUndefined();
    });

    test("should not record a change from an older main build that finished after a newer one", async ({
      project,
      captureConfiguration,
      reviewer,
    }) => {
      const createMainBuild = (commitSha: string, createdAt: string) =>
        dbClient.builds.create({
          projectId: project.id,
          branch: "main",
          commitSha,
          createdAt,
          artifactPath: "builds/main/artifact",
          createdBy: reviewer.id,
        });
      const olderBuild = await createMainBuild("b".repeat(40), "2026-01-01T00:00:00.000Z");
      const newerBuild = await createMainBuild("c".repeat(40), "2026-01-02T00:00:00.000Z");
      const [newer] = await dbClient.snapshots.createMany({
        values: [{ buildId: newerBuild!.id, ...captureConfiguration, targetId: "target-a" }],
      });
      const [older] = await dbClient.snapshots.createMany({
        values: [{ buildId: olderBuild!.id, ...captureConfiguration, targetId: "target-a" }],
      });
      await promoteBaseline(
        (await dbClient.diffs.create({ snapshotId: newer!.id, reviewStatus: "auto_approved" }))!.id,
        reviewer.id,
      );

      await promoteBaseline(
        (await dbClient.diffs.create({ snapshotId: older!.id, reviewStatus: "auto_approved" }))!.id,
        reviewer.id,
      );

      expect(await getBaseline(project.id, captureConfiguration, "target-a")).toMatchObject({
        snapshotId: newer!.id,
      });
      expect(
        await dbClient.baselineRevisions.findFirstAfter(
          { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
          "2000-01-01T00:00:00.000Z",
        ),
      ).toMatchObject({ buildId: newerBuild!.id });
      expect(
        await dbClient.baselineRevisions.findFirstAfter(
          { projectId: project.id, ...captureConfiguration, targetId: "target-a" },
          newerBuild!.createdAt,
        ),
      ).toBeUndefined();
    });
  });

  describe("findComparisonBaseline", () => {
    const BASE = { createdAt: "2026-01-02T00:00:00.000Z" };

    test("should compare against main's latest when the build has no merge base", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [latest] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        snapshotId: latest!.id,
        approvedBy: reviewer.id,
      });

      const result = await findComparisonBaseline(
        project.id,
        captureConfiguration,
        "story-a",
        null,
      );

      expect(result).toEqual({ snapshotId: latest!.id, source: "latest" });
    });

    test("should compare against what the story looked like at the merge base when main changed it since", async ({
      project,
      captureConfiguration,
      mainBuild,
    }) => {
      const [atMergeBase] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await dbClient.baselineRevisions.create({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        buildId: mainBuild.id,
        previousSnapshotId: atMergeBase!.id,
        replacedExisting: true,
        createdAt: "2026-01-03T00:00:00.000Z",
      });

      const result = await findComparisonBaseline(
        project.id,
        captureConfiguration,
        "story-a",
        BASE,
      );

      expect(result).toEqual({ snapshotId: atMergeBase!.id, source: "merge_base" });
    });

    test("should treat a story main added after the merge base as new", async ({
      project,
      captureConfiguration,
      mainBuild,
    }) => {
      await dbClient.baselineRevisions.create({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        buildId: mainBuild.id,
        previousSnapshotId: null,
        replacedExisting: false,
        createdAt: "2026-01-03T00:00:00.000Z",
      });

      const result = await findComparisonBaseline(
        project.id,
        captureConfiguration,
        "story-a",
        BASE,
      );

      expect(result).toEqual({ snapshotId: null, source: "merge_base" });
    });

    test("should fall back to main's latest when the merge-base baseline was purged", async ({
      project,
      captureConfiguration,
      mainBuild,
      reviewer,
    }) => {
      const [latest] = await dbClient.snapshots.createMany({
        values: [{ buildId: mainBuild.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        snapshotId: latest!.id,
        approvedBy: reviewer.id,
      });
      await dbClient.baselineRevisions.create({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        buildId: mainBuild.id,
        previousSnapshotId: null,
        replacedExisting: true,
        createdAt: "2026-01-03T00:00:00.000Z",
      });

      const result = await findComparisonBaseline(
        project.id,
        captureConfiguration,
        "story-a",
        BASE,
      );

      expect(result).toEqual({ snapshotId: latest!.id, source: "expired" });
    });
  });
});
