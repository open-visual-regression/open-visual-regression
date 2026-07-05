import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export const runMigrations = async (
  connectionString: string,
  migrationsFolder: string = path.resolve(import.meta.dirname, "migrations"),
) => {
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, casing: "snake_case" });

  await migrate(db, { migrationsFolder });

  await pool.end();
};
