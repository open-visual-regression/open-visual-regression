import { Redis } from "ioredis";
import { Pool } from "pg";
import { beforeEach } from "vitest";

beforeEach(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const redis = new Redis(process.env.VALKEY_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
  try {
    const { rows } = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    if (tables) {
      await pool.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
    }
    await redis.flushall();
  } finally {
    await pool.end();
    await redis.quit();
  }
});
