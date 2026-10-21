import { Worker } from "bullmq";
import { v7 as uuidv7 } from "uuid";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { organization as organizationTable, projects } from "@ovr/db/schema";
import { QueueName, type RedisConnection, type PurgeJobPayload } from "@ovr/queue";
import { storage } from "@ovr/storage";

import { dispatchPurgeJobs, purgeExpiredBuilds } from "../retention";
import { describe, expect, test } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days: number): string => new Date(Date.now() - days * DAY_MS).toISOString();

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

    test("leaves a baseline-protected build untouched even after it expires", async ({
      project,
      captureConfiguration,
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

      expect(await dbClient.builds.findById(build!.id)).toMatchObject({ id: build!.id });
      const imageStream = await storage.getFileStream(artifactPath);
      expect(imageStream).toBeDefined();
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

    test("removes an expired build's snapshots, diffs, reviews and logs, and unlinks newer diffs from its snapshots", async ({
      project,
      captureConfiguration,
      user,
    }) => {
      const expiredBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
        createdAt: daysAgo(project.retentionDays + 1),
      });
      const recentBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "feature",
        commitSha: "b".repeat(40),
        artifactPath: "artifact",
        createdBy: user.id,
        createdAt: daysAgo(1),
      });
      const [expiredSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: expiredBuild!.id, ...captureConfiguration, targetId: "story-a" }],
      });
      const [recentSnapshot] = await dbClient.snapshots.createMany({
        values: [{ buildId: recentBuild!.id, ...captureConfiguration, targetId: "story-a" }],
      });
      const expiredDiff = await dbClient.diffs.create({ snapshotId: expiredSnapshot!.id });
      await dbClient.diffReviews.upsertVote({
        diffId: expiredDiff!.id,
        reviewerId: user.id,
        vote: "approve",
      });
      await dbClient.snapshotLogs.createMany({
        values: [{ snapshotId: expiredSnapshot!.id, level: "info", message: "captured" }],
      });
      const recentDiff = await dbClient.diffs.create({
        snapshotId: recentSnapshot!.id,
        baselineSnapshotId: expiredSnapshot!.id,
      });

      await purgeExpiredBuilds(project.id);

      expect(await dbClient.builds.findById(expiredBuild!.id)).toBeUndefined();
      expect(await dbClient.diffs.findById(expiredDiff!.id)).toBeUndefined();
      expect(await dbClient.diffReviews.findByDiffs([expiredDiff!.id])).toEqual([]);
      expect(await dbClient.snapshotLogs.findBySnapshot(expiredSnapshot!.id)).toEqual([]);
      expect(await dbClient.diffs.findById(recentDiff!.id)).toMatchObject({
        baselineSnapshotId: null,
        updatedAt: recentDiff!.updatedAt,
      });
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
