import { describe, expect, test } from "vitest";

import { dbClient } from "../../client";
import { seedBuild } from "../helpers/seed";

describe("baselines repository", () => {
  test("upsert creates then replaces existing baseline", async () => {
    const { project, captureConfiguration, build, user } = await seedBuild();
    const [snapshotA, snapshotB] = await dbClient.snapshots.createMany([
      {
        buildId: build.id,
        captureConfigurationId: captureConfiguration.id,
        storyId: "button--primary",
      },
      {
        buildId: build.id,
        captureConfigurationId: captureConfiguration.id,
        storyId: "button--primary",
      },
    ]);

    const created = await dbClient.baselines.upsert({
      projectId: project.id,
      captureConfigurationId: captureConfiguration.id,
      storyId: "button--primary",
      snapshotId: snapshotA!.id,
      approvedBy: user.id,
    });
    expect(created?.snapshotId).toBe(snapshotA!.id);

    const replaced = await dbClient.baselines.upsert({
      projectId: project.id,
      captureConfigurationId: captureConfiguration.id,
      storyId: "button--primary",
      snapshotId: snapshotB!.id,
      approvedBy: user.id,
    });
    expect(replaced?.id).toBe(created?.id);
    expect(replaced?.snapshotId).toBe(snapshotB!.id);

    const found = await dbClient.baselines.find(
      project.id,
      captureConfiguration.id,
      "button--primary",
    );
    expect(found?.snapshotId).toBe(snapshotB!.id);

    const all = await dbClient.baselines.findByProject(project.id);
    expect(all).toHaveLength(1);
  });
});
