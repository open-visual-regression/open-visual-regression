import { sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { startPostgres, type StartedPostgres } from "../helpers/containers";

describe("projects repository", () => {
  let postgres: StartedPostgres;
  let db: typeof import("../../db").db;
  let dbClient: typeof import("../../client").dbClient;
  let schema: typeof import("../../schema");
  let organizationId: string;
  let creatorId: string;

  beforeAll(async () => {
    postgres = await startPostgres();
    process.env.DATABASE_URL = postgres.connectionString;

    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    ({ db } = await import("../../db"));
    ({ dbClient } = await import("../../client"));
    schema = await import("../../schema");

    await migrate(db, { migrationsFolder: new URL("../../migrations", import.meta.url).pathname });
  }, 60_000);

  afterAll(async () => {
    await db.$client.end();
    await postgres.stop();
  });

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE projects, variants, "user", organization RESTART IDENTITY CASCADE`,
    );

    organizationId = uuidv7();
    creatorId = uuidv7();

    await db.insert(schema.organization).values({
      id: organizationId,
      name: "Acme",
      slug: `acme-${organizationId}`,
      createdAt: new Date(),
    });

    await db.insert(schema.user).values({
      id: creatorId,
      name: "Ada Lovelace",
      email: `${creatorId}@example.com`,
    });
  });

  const addProject = () =>
    dbClient.projects.addProject({
      name: "Storybook",
      diffThreshold: 0.05,
      gitMainBranch: "main",
      organizationId,
      creatorId,
    });

  it("addProject persists a project that getProject returns", async () => {
    const project = await addProject();

    const found = await dbClient.projects.getProject({ projectId: project!.id, organizationId });

    expect(found?.id).toBe(project!.id);
    expect(found?.name).toBe("Storybook");
  });

  it("updateProject persists changes", async () => {
    const project = await addProject();

    const updated = await dbClient.projects.updateProject(project!.id, {
      name: "Renamed",
      diffThreshold: 0.1,
    });

    expect(updated?.name).toBe("Renamed");

    const found = await dbClient.projects.getProject({ projectId: project!.id, organizationId });

    expect(found?.name).toBe("Renamed");
    expect(found?.diffThreshold).toBe(0.1);
  });

  it("addVariant persists a variant that findByProject returns", async () => {
    const project = await addProject();

    await dbClient.variants.addVariant({
      projectId: project!.id,
      name: "Desktop",
      browser: "chromium",
      viewportWidth: 1280,
      viewportHeight: 800,
    });

    const found = await dbClient.variants.findByProject(project!.id);

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ name: "Desktop", browser: "chromium" });
  });

  it("deleteProject cascades to variants", async () => {
    const project = await addProject();

    await dbClient.variants.addVariant({
      projectId: project!.id,
      name: "Desktop",
      browser: "chromium",
      viewportWidth: 1280,
      viewportHeight: 800,
    });

    await dbClient.projects.deleteProject(project!.id);

    const found = await dbClient.variants.findByProject(project!.id);

    expect(found).toHaveLength(0);
  });
});
