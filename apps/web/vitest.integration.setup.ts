import { Pool } from "pg";
import { beforeEach } from "vitest";

beforeEach(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    if (tables) {
      await pool.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await pool.end();
  }
});
