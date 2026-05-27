import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startPostgres } from "../helpers/containers";
import * as projectsRepo from "../../repository/projects";
import * as variantsRepo from "../../repository/variants";

let pool: Pool;
let db: NodePgDatabase;
let stopPostgres: () => Promise<void>;

beforeAll(async () => {
  const { connectionString, stop } = await startPostgres();
  stopPostgres = stop;
  pool = new Pool({ connectionString });
  db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./src/migrations" });
});

afterAll(async () => {
  await pool?.end();
  await stopPostgres?.();
});

describe("projects repository", () => {
  it("creates a project and findBySlug returns it", async () => {
    const created = await projectsRepo.create(
      { name: "My Project", slug: "my-project", createdBy: "user-1" },
      db,
    );

    const found = await projectsRepo.findBySlug("my-project", db);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe("My Project");
  });

  it("slugExists returns true for existing slug, false for new", async () => {
    await projectsRepo.create({ name: "Slug Test", slug: "slug-test", createdBy: "user-1" }, db);

    expect(await projectsRepo.slugExists("slug-test", db)).toBe(true);
    expect(await projectsRepo.slugExists("not-a-slug", db)).toBe(false);
  });
});

describe("variants repository", () => {
  it("creates a variant and findByProject returns it", async () => {
    const proj = await projectsRepo.create(
      { name: "Variant Project", slug: "variant-project", createdBy: "user-1" },
      db,
    );

    await variantsRepo.create({ projectId: proj.id, name: "desktop" }, db);

    const variants = await variantsRepo.findByProject(proj.id, db);
    expect(variants).toHaveLength(1);
    expect(variants[0]?.name).toBe("desktop");
  });

  it("deleting a project cascades to variants", async () => {
    const proj = await projectsRepo.create(
      {
        name: "Cascade Project",
        slug: "cascade-project",
        createdBy: "user-1",
      },
      db,
    );

    await variantsRepo.create({ projectId: proj.id, name: "mobile" }, db);
    await projectsRepo.deleteProject(proj.id, db);

    const variants = await variantsRepo.findByProject(proj.id, db);
    expect(variants).toHaveLength(0);
  });
});
