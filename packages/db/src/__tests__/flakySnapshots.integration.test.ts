import { dbClient } from "../client";
import { projects, user as userTable } from "../schema";
import { describe, expect, test, type Viewport } from "./fixtures";

const OPTIONS = { windowBuilds: 30, minReverts: 2, minSamples: 5, minChangeRate: 0.5 };

type Capture = { look: string; commitSha?: string; branch?: string; minutesAgo: number };

const seedCaptures = async (
  project: typeof projects.$inferSelect,
  user: typeof userTable.$inferSelect,
  captureConfiguration: Viewport,
  targetId: string,
  captures: Capture[],
): Promise<void> => {
  const variantIds = new Map<string, string>();

  for (const { look, commitSha, branch = "main", minutesAgo } of captures) {
    const build = await dbClient.builds.create({
      projectId: project.id,
      branch,
      commitSha: commitSha ?? crypto.randomUUID().replaceAll("-", ""),
      artifactPath: "builds/seed/artifact",
      createdBy: user.id,
      createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    });
    const [snapshot] = await dbClient.snapshots.createMany({
      values: [
        { buildId: build!.id, ...captureConfiguration, targetId, status: "success" as const },
      ],
    });

    let variantId = variantIds.get(look);
    if (!variantId) {
      const variant = await dbClient.snapshotVariants.create({
        projectId: project.id,
        browser: captureConfiguration.browser,
        viewportWidth: captureConfiguration.viewportWidth,
        viewportHeight: captureConfiguration.viewportHeight,
        targetId,
        snapshotId: snapshot!.id,
      });
      variantId = variant!.id;
      variantIds.set(look, variantId);
    }
    await dbClient.snapshots.setVariant(snapshot!.id, variantId);
  }
};

const inOrder = (looks: string[]): Capture[] =>
  looks.map((look, index) => ({ look, minutesAgo: looks.length - index }));

describe("flakySnapshots", () => {
  describe("recomputeForProject", () => {
    test("flags a story that keeps returning to an earlier look", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(
        project,
        user,
        captureConfiguration,
        "button--primary",
        inOrder(["a", "b", "a", "b", "a", "b"]),
      );

      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([
        expect.objectContaining({
          targetId: "button--primary",
          sampleCount: 6,
          changeCount: 5,
          revertCount: 4,
        }),
      ]);
    });

    test("flags a story whose look changes on almost every build", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(
        project,
        user,
        captureConfiguration,
        "clock--default",
        inOrder(["a", "b", "c", "d", "e", "f"]),
      );

      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([
        expect.objectContaining({
          targetId: "clock--default",
          changeCount: 5,
          revertCount: 0,
        }),
      ]);
    });

    test("does not flag a story that changed once and stayed changed", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(
        project,
        user,
        captureConfiguration,
        "button--primary",
        inOrder(["a", "a", "a", "b", "b", "b"]),
      );

      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([]);
    });

    test("flags a story captured with different looks for the same commit", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(project, user, captureConfiguration, "button--primary", [
        { look: "a", commitSha: "c".repeat(40), minutesAgo: 2 },
        { look: "b", commitSha: "c".repeat(40), minutesAgo: 1 },
      ]);

      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([
        expect.objectContaining({ targetId: "button--primary", sameCommitMismatchCount: 1 }),
      ]);
    });

    test("orders captures by when their build was created, so builds that finish out of order are not mistaken for flips", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(project, user, captureConfiguration, "button--primary", [
        { look: "b", minutesAgo: 1 },
        { look: "a", minutesAgo: 6 },
        { look: "b", minutesAgo: 2 },
        { look: "a", minutesAgo: 5 },
        { look: "b", minutesAgo: 3 },
        { look: "a", minutesAgo: 4 },
      ]);

      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([]);
    });

    test("only looks at the most recent main-branch builds", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(project, user, captureConfiguration, "button--primary", [
        ...["a", "b", "a", "b"].map((look, index) => ({ look, minutesAgo: 100 - index })),
        ...["a", "a", "a"].map((look, index) => ({ look, minutesAgo: 10 - index })),
      ]);

      await dbClient.flakySnapshots.recomputeForProject(project.id, {
        ...OPTIONS,
        windowBuilds: 3,
      });

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([]);
    });

    test("ignores captures from feature-branch builds", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(project, user, captureConfiguration, "button--primary", [
        ...["a", "a", "a"].map((look, index) => ({ look, minutesAgo: 10 - index })),
        ...["b", "a", "b", "a"].map((look, index) => ({
          look,
          branch: "feature",
          minutesAgo: 5 - index,
        })),
      ]);

      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([]);
    });

    test("clears a flag once the story settles down", async ({
      project,
      user,
      captureConfiguration,
    }) => {
      await seedCaptures(
        project,
        user,
        captureConfiguration,
        "button--primary",
        inOrder(["a", "b", "a", "b"]),
      );
      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);
      expect(await dbClient.flakySnapshots.findByProject(project.id)).toHaveLength(1);

      await dbClient.flakySnapshots.recomputeForProject(project.id, {
        ...OPTIONS,
        windowBuilds: 1,
      });

      expect(await dbClient.flakySnapshots.findByProject(project.id)).toEqual([]);
    });

    test("records when the project was last scanned", async ({ project }) => {
      await dbClient.flakySnapshots.recomputeForProject(project.id, OPTIONS);

      expect((await dbClient.projects.findById(project.id))?.flakyScannedAt).not.toBeNull();
    });
  });
});
