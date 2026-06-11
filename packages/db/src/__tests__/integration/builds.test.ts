import { describe, expect, test } from "vitest";

import { dbClient } from "../../client";
import { seedFixtures } from "../helpers/seed";

describe("builds repository", () => {
  test("create + findById", async () => {
    const { project, user } = await seedFixtures();

    const build = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      storybookPath: "builds/test/storybook",
      createdBy: user.id,
    });

    const found = await dbClient.builds.findById(build!.id);
    expect(found?.id).toBe(build!.id);
    expect(found?.status).toBe("pending");
    expect(found?.captureMode).toBe("worker");
  });

  test("updateStatus", async () => {
    const { project, user } = await seedFixtures();
    const build = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      storybookPath: "builds/test/storybook",
      createdBy: user.id,
    });

    const updated = await dbClient.builds.updateStatus(build!.id, "passed");
    expect(updated?.status).toBe("passed");
  });

  test("findByProject filters by branch and status", async () => {
    const { project, user } = await seedFixtures();
    const main = await dbClient.builds.create({
      projectId: project.id,
      branch: "main",
      commitSha: "a".repeat(40),
      storybookPath: "builds/main/storybook",
      createdBy: user.id,
    });
    await dbClient.builds.create({
      projectId: project.id,
      branch: "feature",
      commitSha: "b".repeat(40),
      storybookPath: "builds/feature/storybook",
      createdBy: user.id,
    });
    await dbClient.builds.updateStatus(main!.id, "passed");

    const mainBuilds = await dbClient.builds.findByProject(project.id, { branch: "main" });
    expect(mainBuilds.map((build) => build.id)).toEqual([main!.id]);

    const passedBuilds = await dbClient.builds.findByProject(project.id, { status: "passed" });
    expect(passedBuilds.map((build) => build.id)).toEqual([main!.id]);

    const allBuilds = await dbClient.builds.findByProject(project.id);
    expect(allBuilds).toHaveLength(2);
  });
});
