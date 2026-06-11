import { describe, expect, test } from "vitest";

import { dbClient } from "../../client";
import { seedBuild } from "../helpers/seed";

describe("diffs repository", () => {
  test("create + findById + findByBuild + hasAllDoneForBuild", async () => {
    const { build, captureConfiguration } = await seedBuild();
    const [snapshot] = await dbClient.snapshots.createMany([
      { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "a" },
    ]);

    const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id });
    expect(diff?.status).toBe("pending");

    const found = await dbClient.diffs.findById(diff!.id);
    expect(found?.id).toBe(diff!.id);

    const byBuild = await dbClient.diffs.findByBuild(build.id);
    expect(byBuild.map((d) => d.id)).toEqual([diff!.id]);

    expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(false);

    await dbClient.diffs.updateStatus(diff!.id, "auto_approved");
    expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(true);
  });

  test("hasAllDoneForBuild returns false for a build with no diffs", async () => {
    const { build } = await seedBuild();

    expect(await dbClient.diffs.hasAllDoneForBuild(build.id)).toBe(false);
  });

  test("updateReview", async () => {
    const { build, captureConfiguration, user } = await seedBuild();
    const [snapshot] = await dbClient.snapshots.createMany([
      { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "a" },
    ]);
    const diff = await dbClient.diffs.create({ snapshotId: snapshot!.id, status: "needs_review" });

    const reviewed = await dbClient.diffs.updateReview(diff!.id, {
      reviewerId: user.id,
      reviewedAt: new Date().toISOString(),
      status: "approved",
    });

    expect(reviewed?.status).toBe("approved");
    expect(reviewed?.reviewerId).toBe(user.id);
    expect(reviewed?.reviewedAt).toBeTruthy();
  });
});
