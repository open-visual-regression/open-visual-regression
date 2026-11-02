import { Worker } from "bullmq";
import { v7 as uuidv7 } from "uuid";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization as organizationTable, projects } from "@ovr/db/schema";
import { QueueName, type RedisConnection, type PurgeJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { dispatchPurgeJobs, purgeExpiredBuilds } from "../retention";
import { describe, expect, setBaselineLastSeenAt, test, type Viewport } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days: number): string => new Date(Date.now() - days * DAY_MS).toISOString();

const createMainBuild = async (
  projectId: string,
  userId: string,
  ageDays: number,
  processingStatus: "queued" | "success" = "queued",
) =>
  (await dbClient.builds.create({
    projectId,
    branch: "main",
    commitSha: "a".repeat(40),
    artifactPath: "artifact",
    processingStatus,
    createdBy: userId,
    createdAt: daysAgo(ageDays),
  }))!;

const promote = async (
  projectId: string,
  userId: string,
  viewport: Viewport,
  snapshotId: string,
  targetId: string,
) =>
  (await dbClient.baselines.upsert({
    projectId,
    browser: viewport.browser,
    viewportWidth: viewport.viewportWidth,
    viewportHeight: viewport.viewportHeight,
    targetId,
    snapshotId,
    approvedBy: userId,
  }))!;

const collectPurgeJobs = async (
  connection: RedisConnection,
  count: number,
): Promise<PurgeJobPayload[]> => {
  const worker = new Worker<PurgeJobPayload>(QueueName.BUILD_PURGE, async (job) => job.data, {
    connection,
  });

  try {
    return await new Promise<PurgeJobPayload[]>((resolve, reject) => {
      const jobs: PurgeJobPayload[] = [];
      worker.on("completed", (job) => {
        jobs.push(job.data);
        if (jobs.length >= count) {
          resolve(jobs);
        }
      });
      worker.on("failed", (_job, error) => reject(error));
    });
  } finally {
    await worker.close();
  }
};

describe("retention", () => {
  describe("purgeExpiredBuilds", () => {
    test("deletes an expired, unprotected build and its storage objects", async ({
      project,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
        createdAt: daysAgo(project.retentionDays + 1),
      });
      const artifactPath = `${project.id}/builds/${build!.id}/artifact.tar.gz`;
      await storage.uploadFile(artifactPath, Buffer.from("artifact"), "application/gzip");

      await purgeExpiredBuilds(project.id);

      expect(await dbClient.builds.findById(build!.id)).toBeUndefined();
      await expect(storage.getFileStream(artifactPath)).rejects.toThrow();
    });

    test("leaves the project's baseline build whole even after it expires", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "artifact",
        processingStatus: "success",
        createdBy: user.id,
        createdAt: daysAgo(project.retentionDays + 1),
      });
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build!.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await dbClient.baselines.upsert({
        projectId: project.id,
        ...captureConfiguration,
        targetId: "story-a",
        snapshotId: snapshot!.id,
        approvedBy: user.id,
      });
      const artifactPath = `${project.id}/builds/${build!.id}/artifact.tar.gz`;
      await storage.uploadFile(artifactPath, Buffer.from("artifact"), "application/gzip");

      await purgeExpiredBuilds(project.id);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({
        id: build!.id,
        strippedAt: null,
      });
      expect(await storage.objectExists(artifactPath)).toBe(true);
    });

    test("strips an expired build a baseline still holds down to its baseline snapshots", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const build = await createMainBuild(project.id, user.id, project.retentionDays + 1);
      const prefix = `${project.id}/builds/${build.id}`;
      const [baselineSnapshot, supersededSnapshot] = await dbClient.snapshots.createMany({
        values: ["story-a", "story-b"].map((targetId) => ({
          buildId: build.id,
          ...captureConfiguration,
          targetId,
          status: "success" as const,
          imagePath: `${prefix}/snapshots/${targetId}-2.png`,
        })),
      });
      const keptDiff = await dbClient.diffs.create({
        snapshotId: baselineSnapshot!.id,
        diffImagePath: `${prefix}/diffs/a.png`,
      });
      await promote(project.id, user.id, captureConfiguration, baselineSnapshot!.id, "story-a");
      // story-b has a newer baseline in a build that is still within retention.
      const newer = await createMainBuild(project.id, user.id, 1, "success");
      const [newerSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: newer.id, ...captureConfiguration, targetId: "story-b" }],
      });
      await promote(project.id, user.id, captureConfiguration, newerSnapshot!.id, "story-b");

      const objects = {
        baselineImage: `${prefix}/snapshots/story-a-2.png`,
        supersededImage: `${prefix}/snapshots/story-b-2.png`,
        retakeImage: `${prefix}/snapshots/story-a-1.png`,
        diffImage: `${prefix}/diffs/a.png`,
        artifact: `${prefix}/artifact.tar.gz`,
      };
      for (const key of Object.values(objects)) {
        await storage.uploadFile(key, Buffer.from(key), "application/octet-stream");
      }

      await purgeExpiredBuilds(project.id);

      expect((await dbClient.builds.findById(build.id))?.strippedAt).not.toBeNull();
      expect((await dbClient.snapshots.findByBuild(build.id)).map((s) => s.id)).toEqual([
        baselineSnapshot!.id,
      ]);
      expect(await dbClient.snapshots.findById(supersededSnapshot!.id)).toBeUndefined();
      expect((await dbClient.diffs.findById(keptDiff!.id))?.diffImagePath).toBeNull();
      expect(await storage.objectExists(objects.baselineImage)).toBe(true);
      for (const key of [
        objects.supersededImage,
        objects.retakeImage,
        objects.diffImage,
        objects.artifact,
      ]) {
        expect(await storage.objectExists(key)).toBe(false);
      }
    });

    test("purges a stripped build once its last baseline is replaced", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const build = await createMainBuild(project.id, user.id, project.retentionDays + 1);
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: build.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await promote(project.id, user.id, captureConfiguration, snapshot!.id, "story-a");
      await createMainBuild(project.id, user.id, 1, "success");

      await purgeExpiredBuilds(project.id);
      expect((await dbClient.builds.findById(build.id))?.strippedAt).not.toBeNull();

      const newer = await createMainBuild(project.id, user.id, 0, "success");
      const [newerSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: newer.id, ...captureConfiguration, targetId: "story-a" }],
      });
      await promote(project.id, user.id, captureConfiguration, newerSnapshot!.id, "story-a");
      await purgeExpiredBuilds(project.id);

      expect(await dbClient.builds.findById(build.id)).toBeUndefined();
    });

    test("expires the baseline of a story the main branch no longer has, then purges its build", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const old = await createMainBuild(project.id, user.id, project.retentionDays + 10);
      const [oldSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: old.id, ...captureConfiguration, targetId: "legacy-modal" }],
      });
      const stale = await promote(
        project.id,
        user.id,
        captureConfiguration,
        oldSnapshot!.id,
        "legacy-modal",
      );
      await setBaselineLastSeenAt(stale.id, daysAgo(project.retentionDays + 10));
      // The main branch built yesterday, without legacy-modal.
      const recent = await createMainBuild(project.id, user.id, 1, "success");
      const [recentSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: recent.id, ...captureConfiguration, targetId: "button" }],
      });
      await promote(project.id, user.id, captureConfiguration, recentSnapshot!.id, "button");

      await purgeExpiredBuilds(project.id);

      expect((await dbClient.baselines.findByProject(project.id)).map((b) => b.targetId)).toEqual([
        "button",
      ]);
      expect(await dbClient.builds.findById(old.id)).toBeUndefined();
    });

    test("keeps baselines when the main branch has stopped building", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const old = await createMainBuild(project.id, user.id, project.retentionDays * 3, "success");
      const [snapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: old.id, ...captureConfiguration, targetId: "story-a" }],
      });
      const baseline = await promote(
        project.id,
        user.id,
        captureConfiguration,
        snapshot!.id,
        "story-a",
      );
      await setBaselineLastSeenAt(baseline.id, daysAgo(project.retentionDays * 3));

      await purgeExpiredBuilds(project.id);

      expect(await dbClient.baselines.findByProject(project.id)).toHaveLength(1);
      expect(await dbClient.builds.findById(old.id)).toMatchObject({ strippedAt: null });
    });

    test("leaves a build within the retention window untouched", async ({ project, user }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
        createdAt: daysAgo(1),
      });

      await purgeExpiredBuilds(project.id);

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({ id: build!.id });
    });

    test("purges in batches and leaves the rest for the next run once the time budget is spent", async ({
      project,
      user,
    }) => {
      const expiredBuilds = await Promise.all(
        [3, 2, 1].map((extraDays) =>
          dbClient.builds.create({
            projectId: project.id,
            branch: "main",
            commitSha: "a".repeat(40),
            artifactPath: "artifact",
            createdBy: user.id,
            createdAt: daysAgo(project.retentionDays + extraDays),
          }),
        ),
      );
      const remaining = async () =>
        (await Promise.all(expiredBuilds.map((build) => dbClient.builds.findById(build!.id))))
          .filter((build) => build !== undefined)
          .map((build) => build.id);

      await purgeExpiredBuilds(project.id, { batchSize: 1, batchPauseMs: 0, timeBudgetMs: 1 });

      expect(await remaining()).toEqual([expiredBuilds[1]!.id, expiredBuilds[2]!.id]);

      await purgeExpiredBuilds(project.id, { batchSize: 1, batchPauseMs: 0 });

      expect(await remaining()).toEqual([]);
    });

    test("does nothing for a project that no longer exists", async () => {
      await expect(purgeExpiredBuilds(uuidv7())).resolves.toBeUndefined();
    });
  });

  describe("dispatchPurgeJobs", () => {
    test("enqueues one purge job per project across every organization", async ({
      organization: _organization,
      project,
      user,
      connection,
    }) => {
      const [otherOrg] = await db
        .insert(organizationTable)
        .values({ id: uuidv7(), name: "Other Org", slug: uuidv7(), createdAt: new Date() })
        .returning();
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Org Project",
          gitMainBranch: "main",
          organizationId: otherOrg!.id,
          creatorId: user.id,
        })
        .returning();

      await dispatchPurgeJobs();
      const jobs = await collectPurgeJobs(connection, 2);

      expect(jobs.map((job) => job.projectId).sort()).toEqual(
        [project.id, otherProject!.id].sort(),
      );
    }, 30000);
  });
});
