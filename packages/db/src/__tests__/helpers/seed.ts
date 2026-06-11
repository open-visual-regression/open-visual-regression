import { v7 as uuidv7 } from "uuid";

import { dbClient } from "../../client";
import { db } from "../../db";
import { captureConfigurations, organization, projects, user } from "../../schema";

export const seedFixtures = async () => {
  const [createdUser] = await db
    .insert(user)
    .values({ id: uuidv7(), name: "Test User", email: `${uuidv7()}@example.com` })
    .returning();

  const [createdOrganization] = await db
    .insert(organization)
    .values({ id: uuidv7(), name: "Test Org", slug: uuidv7(), createdAt: new Date() })
    .returning();

  const [project] = await db
    .insert(projects)
    .values({
      name: "Test Project",
      diffThreshold: 0.1,
      gitMainBranch: "main",
      organizationId: createdOrganization!.id,
      creatorId: createdUser!.id,
    })
    .returning();

  const [captureConfiguration] = await db
    .insert(captureConfigurations)
    .values({ projectId: project!.id, name: "Default" })
    .returning();

  return {
    user: createdUser!,
    organization: createdOrganization!,
    project: project!,
    captureConfiguration: captureConfiguration!,
  };
};

export const seedBuild = async () => {
  const fixtures = await seedFixtures();

  const build = await dbClient.builds.create({
    projectId: fixtures.project.id,
    branch: "main",
    commitSha: "a".repeat(40),
    storybookPath: "builds/seed/storybook",
    createdBy: fixtures.user.id,
  });

  return { ...fixtures, build: build! };
};
