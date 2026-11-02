import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../client";
import { db } from "../db";
import type { BaselinesCursor } from "../repository/baselines";
import { flakySnapshots, organization as organizationTable, projects } from "../schema";
import { describe, expect, test, type Viewport } from "./fixtures";

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

  describe("listForOrganization", () => {
    const promoteStories = async (
      { projectId, buildId, userId }: { projectId: string; buildId: string; userId: string },
      viewport: Viewport,
      stories: { targetId: string; targetTitle: string; hasUncaughtPageError?: boolean }[],
    ) => {
      const created = await dbClient.snapshots.createMany({
        values: stories.map((story) => ({
          buildId,
          ...viewport,
          targetName: "Default",
          ...story,
        })),
      });

      for (const snapshot of created) {
        await dbClient.baselines.upsert({
          projectId,
          ...viewport,
          targetId: snapshot.targetId,
          snapshotId: snapshot.id,
          approvedBy: userId,
        });
      }

      return created;
    };

    test("should list each baseline with its project and whether its story is flaky or warned", async ({
      organization,
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      await promoteStories(
        { projectId: project.id, buildId: build.id, userId: user.id },
        captureConfiguration,
        [
          { targetId: "button--default", targetTitle: "Button" },
          { targetId: "card--default", targetTitle: "Card", hasUncaughtPageError: true },
        ],
      );
      await db.insert(flakySnapshots).values({
        projectId: project.id,
        browser: captureConfiguration.browser,
        viewportWidth: captureConfiguration.viewportWidth,
        viewportHeight: captureConfiguration.viewportHeight,
        targetId: "button--default",
        sampleCount: 10,
        changeCount: 9,
        revertCount: 4,
        sameCommitMismatchCount: 0,
      });

      const { baselines, nextCursor } = await dbClient.baselines.listForOrganization(
        organization.id,
        { limit: 10 },
      );

      expect(
        baselines.map(({ targetTitle, projectName, buildId, isFlaky, hasUncaughtPageError }) => ({
          targetTitle,
          projectName,
          buildId,
          isFlaky,
          hasUncaughtPageError,
        })),
      ).toEqual([
        {
          targetTitle: "Button",
          projectName: project.name,
          buildId: build.id,
          isFlaky: true,
          hasUncaughtPageError: false,
        },
        {
          targetTitle: "Card",
          projectName: project.name,
          buildId: build.id,
          isFlaky: false,
          hasUncaughtPageError: true,
        },
      ]);
      expect(nextCursor).toBeNull();
      expect(await dbClient.baselines.countForOrganization(organization.id)).toBe(2);
    });

    test("should not list another organization's baselines", async ({
      organization,
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const [otherOrganization] = await db
        .insert(organizationTable)
        .values({ id: uuidv7(), name: "Other Org", slug: uuidv7(), createdAt: new Date() })
        .returning();
      const [otherProject] = await db
        .insert(projects)
        .values({
          name: "Other Project",
          gitMainBranch: "main",
          organizationId: otherOrganization!.id,
          creatorId: user.id,
        })
        .returning();
      const otherBuild = await dbClient.builds.create({
        projectId: otherProject!.id,
        branch: "main",
        commitSha: "c".repeat(40),
        artifactPath: "builds/seed/artifact",
        createdBy: user.id,
      });
      await promoteStories(
        { projectId: project.id, buildId: build.id, userId: user.id },
        captureConfiguration,
        [{ targetId: "button--default", targetTitle: "Button" }],
      );
      await promoteStories(
        { projectId: otherProject!.id, buildId: otherBuild!.id, userId: user.id },
        captureConfiguration,
        [{ targetId: "secret--default", targetTitle: "Secret" }],
      );

      const { baselines } = await dbClient.baselines.listForOrganization(organization.id, {
        limit: 10,
      });

      expect(baselines.map(({ targetTitle }) => targetTitle)).toEqual(["Button"]);
      expect(await dbClient.baselines.countForOrganization(organization.id)).toBe(1);
    });

    test("should page through every baseline exactly once, ordered by story", async ({
      organization,
      project,
      captureConfiguration,
      build,
      user,
    }) => {
      const titles = ["Tabs", "Alert", "Card", "Badge", "Switch"];
      await promoteStories(
        { projectId: project.id, buildId: build.id, userId: user.id },
        captureConfiguration,
        titles.map((title) => ({
          targetId: `${title.toLowerCase()}--default`,
          targetTitle: title,
        })),
      );

      const seen: string[] = [];
      let cursor: BaselinesCursor | undefined;
      do {
        const page = await dbClient.baselines.listForOrganization(organization.id, {
          limit: 2,
          cursor,
        });
        seen.push(...page.baselines.map(({ targetTitle }) => targetTitle));
        cursor = page.nextCursor ?? undefined;
      } while (cursor);

      expect(seen).toEqual([...titles].sort());
    });
  });
});
