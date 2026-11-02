import { eq } from "drizzle-orm";

import { dbClient } from "../client";
import { db } from "../db";
import { baselines } from "../schema";
import { describe, expect, test, type Viewport } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days: number): string => new Date(Date.now() - days * DAY_MS).toISOString();

type BaselineSetup = {
  projectId: string;
  buildId: string;
  userId: string;
  captureConfiguration: Viewport;
};

const createBaseline = async (
  { projectId, buildId, userId, captureConfiguration }: BaselineSetup,
  targetId: string,
  lastSeenDaysAgo = 0,
) => {
  const [snapshot] = await dbClient.snapshots.createMany({
    values: [{ buildId, ...captureConfiguration, targetId }],
  });
  const baseline = await dbClient.baselines.upsert({
    projectId,
    ...captureConfiguration,
    targetId,
    snapshotId: snapshot!.id,
    approvedBy: userId,
  });
  const [aged] = await db
    .update(baselines)
    .set({ lastSeenAt: daysAgo(lastSeenDaysAgo) })
    .where(eq(baselines.id, baseline!.id))
    .returning();
  return aged!;
};

const findLastSeenAt = async (id: string) =>
  (await db.query.baselines.findFirst({ where: (b, { eq }) => eq(b.id, id) }))?.lastSeenAt;

describe("baselines", () => {
  describe("upsert", () => {
    test("should create a baseline when none exists", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });

      const created = await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      expect(created?.snapshotId).toBe(snapshot!.id);
    });

    test("should replace the existing baseline for the same project, capture configuration, and story", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshotA, snapshotB] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });

      const created = await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshotA!.id,
        approvedBy: user.id,
      });

      const replaced = await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshotB!.id,
        approvedBy: user.id,
      });

      expect(replaced?.id).toBe(created?.id);
      expect(replaced?.snapshotId).toBe(snapshotB!.id);
    });

    test("should keep the baseline from a newer build when an older build is promoted after it", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const newerBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/seed/artifact",
        createdBy: user.id,
      });
      const [olderSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "button--primary" }],
      });
      const [newerSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: newerBuild!.id, ...captureConfiguration, targetId: "button--primary" }],
      });

      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: newerSnapshot!.id,
        approvedBy: user.id,
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: olderSnapshot!.id,
        approvedBy: user.id,
      });

      const found = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
      });
      expect(found?.snapshotId).toBe(newerSnapshot!.id);
    });
  });

  describe("find", () => {
    test("should return the baseline matching the project, capture configuration, and story", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const found = await dbClient.baselines.find({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
      });
      expect(found?.snapshotId).toBe(snapshot!.id);
    });
  });

  describe("findByProject", () => {
    test("should return all baselines for the project", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build.id,
            ...captureConfiguration,
            targetId: "button--primary",
          },
        ],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "button--primary",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });

      const all = await dbClient.baselines.findByProject(project.id);
      expect(all).toHaveLength(1);
    });
  });

  describe("markSeenInMainBuild", () => {
    test("marks the baselines of every story a main-branch build has, skipped ones included", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const setup = {
        projectId: project.id,
        buildId: build.id,
        userId: user.id,
        captureConfiguration,
      };
      const kept = await createBaseline(setup, "button--primary", 50);
      const deleted = await createBaseline(setup, "legacy--modal", 50);
      const mainBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
      });
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild!.id,
            ...captureConfiguration,
            targetId: "button--primary",
            status: "skipped",
          },
        ],
      });

      await dbClient.baselines.markSeenInMainBuild(mainBuild!.id);

      expect(Date.parse((await findLastSeenAt(kept.id))!)).toBeGreaterThan(Date.now() - DAY_MS);
      expect(await findLastSeenAt(deleted.id)).toBe(deleted.lastSeenAt);
    });

    test("keeps every viewport of a story that failed to load", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const setup = {
        projectId: project.id,
        buildId: build.id,
        userId: user.id,
        captureConfiguration,
      };
      const mobile = await createBaseline(
        { ...setup, captureConfiguration: { ...captureConfiguration, viewportWidth: 375 } },
        "button--primary",
        50,
      );
      const mainBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
      });
      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: mainBuild!.id,
            ...captureConfiguration,
            targetId: "button--primary",
            status: "error",
          },
        ],
      });

      await dbClient.baselines.markSeenInMainBuild(mainBuild!.id);

      expect(Date.parse((await findLastSeenAt(mobile.id))!)).toBeGreaterThan(Date.now() - DAY_MS);
    });

    test("ignores builds off the main branch", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const setup = {
        projectId: project.id,
        buildId: build.id,
        userId: user.id,
        captureConfiguration,
      };
      const baseline = await createBaseline(setup, "button--primary", 50);
      const featureBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "feature/x",
        commitSha: "b".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
      });
      await dbClient.snapshots.createMany({
        values: [
          { buildId: featureBuild!.id, ...captureConfiguration, targetId: "button--primary" },
        ],
      });

      await dbClient.baselines.markSeenInMainBuild(featureBuild!.id);

      expect(await findLastSeenAt(baseline.id)).toBe(baseline.lastSeenAt);
    });
  });

  describe("removeUnseenPage", () => {
    test("removes baselines unseen for the window, counted back from the latest seen one", async ({
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const setup = {
        projectId: project.id,
        buildId: build.id,
        userId: user.id,
        captureConfiguration,
      };
      // The main branch last built 100 days ago, so only legacy--modal (seen 140 days ago) is
      // more than 30 days behind it.
      const latest = await createBaseline(setup, "button--primary", 100);
      const recent = await createBaseline(setup, "card--default", 120);
      const stale = await createBaseline(setup, "legacy--modal", 140);

      const removed = await dbClient.baselines.removeUnseenPage(project.id, 30, 10);

      expect(removed).toBe(1);
      const remaining = (await dbClient.baselines.findByProject(project.id)).map((b) => b.id);
      expect(remaining.sort()).toEqual([latest.id, recent.id].sort());
      expect(remaining).not.toContain(stale.id);
    });

    test("removes at most one page", async ({ project, captureConfiguration, build, user }) => {
      const setup = {
        projectId: project.id,
        buildId: build.id,
        userId: user.id,
        captureConfiguration,
      };
      await createBaseline(setup, "button--primary", 0);
      for (const targetId of ["a", "b", "c"]) {
        await createBaseline(setup, targetId, 60);
      }

      expect(await dbClient.baselines.removeUnseenPage(project.id, 30, 2)).toBe(2);
      expect(await dbClient.baselines.removeUnseenPage(project.id, 30, 2)).toBe(1);
      expect(await dbClient.baselines.removeUnseenPage(project.id, 30, 2)).toBe(0);
    });

    test("does nothing for a project without baselines", async ({ project }) => {
      expect(await dbClient.baselines.removeUnseenPage(project.id, 30, 10)).toBe(0);
    });
  });
});
