import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../client";
import { db } from "../db";
import {
  builds,
  organization as organizationTable,
  projects,
  type BuildProcessingStatus,
} from "../schema";
import { describe, expect, test } from "./fixtures";

describe("builds", () => {
  describe("create", () => {
    test("should create a build with queued processing status and worker capture mode by default", async ({
      project,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/test/artifact",
        createdBy: user.id,
      });

      expect(build?.processingStatus).toBe("queued");
      expect(build?.reviewStatus).toBe("not_required");
      expect(build?.captureMode).toBe("worker");
    });
  });

  describe("findById", () => {
    test("should return the build matching the given id", async ({ build }) => {
      const found = await dbClient.builds.findById(build.id);
      expect(found?.id).toBe(build.id);
    });
  });

  describe("updateProcessingStatus", () => {
    test("should update the build's processing status", async ({ build }) => {
      const updated = await dbClient.builds.updateProcessingStatus(build.id, "success");
      expect(updated?.processingStatus).toBe("success");
    });

    test("should leave both lifecycle timestamps unset while the build is queued", async ({
      build,
    }) => {
      expect(build.startedAt).toBeNull();
      expect(build.finishedAt).toBeNull();
    });

    test("should stamp startedAt when the build starts processing", async ({ build }) => {
      const updated = await dbClient.builds.updateProcessingStatus(build.id, "processing");

      expect(updated?.startedAt).not.toBeNull();
      expect(updated?.finishedAt).toBeNull();
    });

    test("should keep the original startedAt when the extract job is retried", async ({
      build,
    }) => {
      const first = await dbClient.builds.updateProcessingStatus(build.id, "processing");
      const retried = await dbClient.builds.updateProcessingStatus(build.id, "processing");

      expect(retried?.startedAt).toBe(first?.startedAt);
    });

    test("should stamp finishedAt when the build reaches a terminal status", async ({ build }) => {
      await dbClient.builds.updateProcessingStatus(build.id, "processing");
      const errored = await dbClient.builds.updateProcessingStatus(build.id, "error", "boom");

      expect(errored?.startedAt).not.toBeNull();
      expect(errored?.finishedAt).not.toBeNull();
    });
  });

  describe("cancelIfInProgress", () => {
    test("should stamp finishedAt but leave startedAt unset for a build canceled while queued", async ({
      build,
    }) => {
      const canceled = await dbClient.builds.cancelIfInProgress(build.id, null);

      expect(canceled?.startedAt).toBeNull();
      expect(canceled?.finishedAt).not.toBeNull();
    });
  });

  describe("updateResult", () => {
    test("should stamp finishedAt when the build is finalized", async ({ build }) => {
      await dbClient.builds.updateProcessingStatus(build.id, "processing");
      const finalized = await dbClient.builds.updateResult(build.id, {
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      expect(finalized?.finishedAt).not.toBeNull();
    });

    test("should keep the original finishedAt when a later review changes the review status", async ({
      build,
    }) => {
      await dbClient.builds.updateProcessingStatus(build.id, "processing");
      const finalized = await dbClient.builds.updateResult(build.id, {
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const reviewed = await dbClient.builds.updateResult(build.id, {
        processingStatus: "success",
        reviewStatus: "approved",
      });

      expect(reviewed?.reviewStatus).toBe("approved");
      expect(reviewed?.finishedAt).toBe(finalized?.finishedAt);
    });
  });

  describe("findMany", () => {
    test("should break a createdAt tie on the build id", async ({ build, project, user }) => {
      const sameInstant = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/seed/artifact",
        createdBy: user.id,
      });
      await db
        .update(builds)
        .set({ createdAt: build.createdAt })
        .where(eq(builds.id, sameInstant!.id));

      const newerThanFirst = await dbClient.builds.findMany({
        projectIds: [project.id],
        branches: ["main"],
        createdAfter: { createdAt: build.createdAt, id: build.id },
      });
      const newerThanSecond = await dbClient.builds.findMany({
        projectIds: [project.id],
        branches: ["main"],
        createdAfter: { createdAt: build.createdAt, id: sameInstant!.id },
      });

      expect(newerThanFirst.map(({ id }) => id)).toEqual([sameInstant!.id]);
      expect(newerThanSecond).toEqual([]);
    });

    test("should only return older in-flight builds on the same branch", async ({
      project,
      user,
    }) => {
      const create = async (branch: string, processingStatus: BuildProcessingStatus) =>
        (await dbClient.builds.create({
          projectId: project.id,
          branch,
          commitSha: "a".repeat(40),
          processingStatus,
          artifactPath: "builds/seed/artifact",
          createdBy: user.id,
        }))!;

      const queued = await create("feature", "queued");
      const processing = await create("feature", "processing");
      await create("feature", "success");
      await create("other-branch", "queued");
      const newest = await create("feature", "queued");

      const stale = await dbClient.builds.findMany({
        projectIds: [project.id],
        branches: ["feature"],
        processingStatuses: ["queued", "processing"],
        createdBefore: { createdAt: newest.createdAt, id: newest.id },
      });

      expect(stale.map(({ id }) => id).sort()).toEqual([queued.id, processing.id].sort());
    });
  });

  describe("cancelIfInProgress", () => {
    test("cancels a queued build and records who canceled it", async ({ build, user }) => {
      const updated = await dbClient.builds.cancelIfInProgress(build.id, user.id);

      expect(updated).toMatchObject({ processingStatus: "canceled", canceledBy: user.id });
    });

    test("records no user when the system cancels the build", async ({ build }) => {
      const updated = await dbClient.builds.cancelIfInProgress(build.id, null);

      expect(updated).toMatchObject({ processingStatus: "canceled", canceledBy: null });
    });

    test("cancels a processing build", async ({ build, user }) => {
      await dbClient.builds.updateProcessingStatus(build.id, "processing");

      const updated = await dbClient.builds.cancelIfInProgress(build.id, user.id);

      expect(updated).toMatchObject({ processingStatus: "canceled", canceledBy: user.id });
    });

    test("does not cancel a build that has already finished", async ({ build, user }) => {
      await dbClient.builds.updateProcessingStatus(build.id, "success");

      const updated = await dbClient.builds.cancelIfInProgress(build.id, user.id);

      expect(updated).toBeUndefined();
      expect(await dbClient.builds.findById(build.id)).toMatchObject({
        processingStatus: "success",
        canceledBy: null,
      });
    });
  });

  describe("updateResult", () => {
    test("should update the build's processing and review status together", async ({ build }) => {
      const updated = await dbClient.builds.updateResult(build.id, {
        processingStatus: "success",
        reviewStatus: "approved",
      });
      expect(updated).toMatchObject({ processingStatus: "success", reviewStatus: "approved" });
    });
  });

  describe("findAll", () => {
    test("should return builds across all projects in the organization, most recent first", async ({
      organization,
      project,
      user,
    }) => {
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
        })
        .returning();

      const older = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const newer = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        createdAt: "2024-01-02T00:00:00.000Z",
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 10,
      });

      expect(total).toBe(2);
      expect(builds.map((build) => build.id)).toEqual([newer!.id, older!.id]);
      expect(builds[0]).toMatchObject({
        projectId: otherProject!.id,
        projectName: "Other Project",
        branch: "main",
        commitSha: "b".repeat(40),
        processingStatus: "queued",
        reviewStatus: "not_required",
      });
    });

    test("should not return builds belonging to other organizations", async ({
      organization,
      project,
      user,
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

      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 10,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.projectId)).toEqual([project.id]);
    });

    test("should only return builds for the given projects", async ({
      organization,
      project,
      user,
    }) => {
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
        })
        .returning();

      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      const otherProjectBuild = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        projectIds: [otherProject!.id],
        limit: 10,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([otherProjectBuild!.id]);
    });

    test("should only return builds matching the given processing status", async ({
      organization,
      project,
      user,
      build: queuedBuild,
    }) => {
      const successBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateProcessingStatus(successBuild!.id, "success");

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        processingStatus: "success",
        limit: 10,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([successBuild!.id]);
      expect(queuedBuild.processingStatus).toBe("queued");
    });

    test("should only return builds with a name matching the search term", async ({
      organization,
      project,
      user,
    }) => {
      const matchingBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        name: "fix: cart total rounding",
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        name: "feat: add checkout flow",
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        search: "cart",
        limit: 10,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([matchingBuild!.id]);
    });

    test("should not match the search term against branch, commit sha, or author", async ({
      organization,
      project,
      user,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "cart-feature",
        commitSha: "cartcartcartcartcartcartcartcartcartcart",
        author: "cart bot",
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        search: "cart",
        limit: 10,
      });

      expect(total).toBe(0);
      expect(builds).toHaveLength(0);
    });

    test("should paginate with the limit and cursor params", async ({
      organization,
      project,
      user,
    }) => {
      for (let i = 0; i < 3; i++) {
        await dbClient.builds.create({
          projectId: project.id,
          branch: "main",
          commitSha: i.toString().repeat(40),
          artifactPath: `builds/${i}/artifact`,
          createdBy: user.id,
          createdAt: `2024-01-0${i + 1}T00:00:00.000Z`,
        });
      }

      const firstPage = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 2,
      });

      expect(firstPage.total).toBe(3);
      expect(firstPage.builds.map((build) => build.commitSha)).toEqual([
        "2".repeat(40),
        "1".repeat(40),
      ]);
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await dbClient.builds.findAll({
        organizationId: organization.id,
        limit: 2,
        cursor: firstPage.nextCursor!,
      });

      expect(secondPage.builds.map((build) => build.commitSha)).toEqual(["0".repeat(40)]);
      expect(secondPage.nextCursor).toBeNull();
    });

    test("should return the oldest builds first when sorted ascending", async ({
      organization,
      project,
      user,
    }) => {
      const older = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        createdAt: "2024-01-01T00:00:00.000Z",
      });

      const newer = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        createdAt: "2024-01-02T00:00:00.000Z",
      });

      const { builds } = await dbClient.builds.findAll({
        organizationId: organization.id,
        sortDirection: "asc",
        limit: 10,
      });

      expect(builds.map((build) => build.id)).toEqual([older!.id, newer!.id]);
    });

    test("should only return builds matching one of the given status filters", async ({
      organization,
      project,
      user,
      build: queuedBuild,
    }) => {
      const approvedBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateResult(approvedBuild!.id, {
        processingStatus: "success",
        reviewStatus: "approved",
      });

      const unchangedBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "c".repeat(40),
        artifactPath: "builds/c/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateResult(unchangedBuild!.id, {
        processingStatus: "success",
        reviewStatus: "unchanged",
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        statuses: [
          { processingStatus: "queued" },
          { processingStatus: "success", reviewStatus: "approved" },
        ],
        limit: 10,
      });

      expect(total).toBe(2);
      expect(builds.map((build) => build.id).sort()).toEqual(
        [queuedBuild.id, approvedBuild!.id].sort(),
      );
      expect(builds.map((build) => build.id)).not.toContain(unchangedBuild!.id);
    });

    test("should only return builds matching one of the given branches", async ({
      organization,
      project,
      user,
      build: mainBuild,
    }) => {
      const featureBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "feature/onboarding",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        branches: ["feature/onboarding"],
        limit: 10,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([featureBuild!.id]);
      expect(builds.map((build) => build.id)).not.toContain(mainBuild.id);
    });

    test("should only return builds matching one of the given authors", async ({
      organization,
      project,
      user,
    }) => {
      const jordanBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        author: "Jordan Lee",
      });

      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        author: "Alex Kim",
      });

      const { builds, total } = await dbClient.builds.findAll({
        organizationId: organization.id,
        authors: ["Jordan Lee"],
        limit: 10,
      });

      expect(total).toBe(1);
      expect(builds.map((build) => build.id)).toEqual([jordanBuild!.id]);
    });
  });

  describe("findBranches", () => {
    test("should return the distinct branches captured for the project, sorted alphabetically", async ({
      project,
      user,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.create({
        projectId: project.id,
        branch: "develop",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.create({
        projectId: project.id,
        branch: "develop",
        commitSha: "c".repeat(40),
        artifactPath: "builds/c/artifact",
        createdBy: user.id,
      });

      const branches = await dbClient.builds.findBranches(project.id, { limit: 20 });

      expect(branches).toEqual(["develop", "main"]);
    });

    test("should only return branches matching the search term", async ({ project, user }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.create({
        projectId: project.id,
        branch: "feature/onboarding",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });

      const branches = await dbClient.builds.findBranches(project.id, {
        search: "feat",
        limit: 20,
      });

      expect(branches).toEqual(["feature/onboarding"]);
    });

    test("should cap the number of branches at the given limit", async ({ project, user }) => {
      for (let index = 0; index < 5; index++) {
        await dbClient.builds.create({
          projectId: project.id,
          branch: `branch-${index}`,
          commitSha: index.toString().repeat(40),
          artifactPath: `builds/${index}/artifact`,
          createdBy: user.id,
        });
      }

      const branches = await dbClient.builds.findBranches(project.id, { limit: 3 });

      expect(branches).toEqual(["branch-0", "branch-1", "branch-2"]);
    });

    test("should not return branches captured for a different project", async ({
      organization,
      project,
      user,
    }) => {
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
        })
        .returning();

      await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      const branches = await dbClient.builds.findBranches(project.id, { limit: 20 });
      expect(branches).toEqual([]);
    });
  });

  describe("findAuthors", () => {
    test("should return the distinct non-null authors captured for the project, sorted alphabetically", async ({
      project,
      user,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        author: "Jordan Lee",
      });
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        author: "Alex Kim",
      });
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "c".repeat(40),
        artifactPath: "builds/c/artifact",
        createdBy: user.id,
      });

      const authors = await dbClient.builds.findAuthors(project.id, { limit: 20 });

      expect(authors).toEqual(["Alex Kim", "Jordan Lee"]);
    });

    test("should only return authors matching the search term", async ({ project, user }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
        author: "Jordan Lee",
      });
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
        author: "Alex Kim",
      });

      const authors = await dbClient.builds.findAuthors(project.id, {
        search: "kim",
        limit: 20,
      });

      expect(authors).toEqual(["Alex Kim"]);
    });
  });

  describe("findStatuses", () => {
    test("should return the distinct derived display statuses present in the project, in canonical order", async ({
      project,
      user,
    }) => {
      await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      const unchangedBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "b".repeat(40),
        artifactPath: "builds/b/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateResult(unchangedBuild!.id, {
        processingStatus: "success",
        reviewStatus: "not_required",
      });

      const needsReviewBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "c".repeat(40),
        artifactPath: "builds/c/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateResult(needsReviewBuild!.id, {
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const duplicateNeedsReviewBuild = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "d".repeat(40),
        artifactPath: "builds/d/artifact",
        createdBy: user.id,
      });
      await dbClient.builds.updateResult(duplicateNeedsReviewBuild!.id, {
        processingStatus: "success",
        reviewStatus: "needs_review",
      });

      const statuses = await dbClient.builds.findStatuses(project.id);

      expect(statuses).toEqual(["queued", "needs_review", "unchanged"]);
    });

    test("should not return statuses for a different project", async ({
      organization,
      project,
      user,
    }) => {
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: user.id,
        })
        .returning();

      await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/a/artifact",
        createdBy: user.id,
      });

      const statuses = await dbClient.builds.findStatuses(project.id);
      expect(statuses).toEqual([]);
    });
  });

  describe("findStale", () => {
    const OLD_TIMESTAMP = "2020-01-01T00:00:00.000Z";
    const CUTOFF = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    test("should return a build that is old with no recent snapshot or diff activity", async ({
      project,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/stale/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });

      const staleIds = await dbClient.builds.findStale(CUTOFF, 100);
      expect(staleIds).toContain(build!.id);
    });

    test("should not return a build younger than the stale window", async ({ project, user }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/fresh/artifact",
        createdBy: user.id,
      });

      const staleIds = await dbClient.builds.findStale(CUTOFF, 100);
      expect(staleIds).not.toContain(build!.id);
    });

    test("should not return a build whose snapshots updated recently even if the build itself is old", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/progressing/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });

      await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-a",
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const staleIds = await dbClient.builds.findStale(CUTOFF, 100);
      expect(staleIds).not.toContain(build!.id);
    });

    test("should not return a build whose diffs updated recently even if the build itself is old", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/diff-progressing/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });

      const [snapshot] = await dbClient.snapshots.createMany({
        values: [
          {
            buildId: build!.id,
            ...captureConfiguration,
            targetId: "story-a",
            status: "success",
            updatedAt: OLD_TIMESTAMP,
          },
        ],
      });

      await dbClient.diffs.create({
        snapshotId: snapshot!.id,
        updatedAt: new Date().toISOString(),
      });

      const staleIds = await dbClient.builds.findStale(CUTOFF, 100);
      expect(staleIds).not.toContain(build!.id);
    });

    test("should not return a build that already reached a terminal processing status", async ({
      project,
      user,
    }) => {
      const build = await dbClient.builds.create({
        projectId: project.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/done/artifact",
        createdBy: user.id,
        createdAt: OLD_TIMESTAMP,
        updatedAt: OLD_TIMESTAMP,
      });
      await dbClient.builds.updateProcessingStatus(build!.id, "success");

      const staleIds = await dbClient.builds.findStale(CUTOFF, 100);
      expect(staleIds).not.toContain(build!.id);
    });
  });
});
