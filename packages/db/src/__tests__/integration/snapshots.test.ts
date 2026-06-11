import { dbClient } from "../../client";
import { describe, expect, test } from "../fixtures";

describe("snapshots repository", () => {
  test("createMany + findByBuild + countByBuild", async ({ build, captureConfiguration }) => {
    const created = await dbClient.snapshots.createMany([
      {
        buildId: build.id,
        captureConfigurationId: captureConfiguration.id,
        storyId: "button--primary",
      },
      {
        buildId: build.id,
        captureConfigurationId: captureConfiguration.id,
        storyId: "button--secondary",
      },
    ]);
    expect(created).toHaveLength(2);

    const found = await dbClient.snapshots.findByBuild(build.id);
    expect(found).toHaveLength(2);

    expect(await dbClient.snapshots.countByBuild(build.id)).toBe(2);
  });

  test("updateStatus + hasAllCapturedForBuild", async ({ build, captureConfiguration }) => {
    const [a, b] = await dbClient.snapshots.createMany([
      { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "a" },
      { buildId: build.id, captureConfigurationId: captureConfiguration.id, storyId: "b" },
    ]);

    expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);

    await dbClient.snapshots.updateStatus(a!.id, "captured");
    expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);

    await dbClient.snapshots.updateStatus(b!.id, "error");
    expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(true);
  });

  test("hasAllCapturedForBuild returns false for a build with no snapshots", async ({ build }) => {
    expect(await dbClient.snapshots.hasAllCapturedForBuild(build.id)).toBe(false);
  });
});
