import path from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export const runMigrations = async (connectionString: string) => {
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, casing: "snake_case" });

  await migrate(db, {
    migrationsFolder: path.resolve(import.meta.dirname, "migrations"),
  });

  await pool.end();
};
