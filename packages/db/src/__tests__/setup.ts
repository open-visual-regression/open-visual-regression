import { beforeEach } from "vitest";

import { db, sql } from "../db";

beforeEach(async () => {
  await db.execute(sql`
    TRUNCATE "user", organization, projects, capture_configurations,
      builds, snapshots, snapshot_logs, diffs, baselines
    RESTART IDENTITY CASCADE
  `);
});
