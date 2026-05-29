import { beforeEach } from "vitest";

import { db, sql } from "@ovr/db/db";

beforeEach(async () => {
  await db.execute(sql`
    TRUNCATE "user", organization, session, account, verification, apikey, member, invitation
    RESTART IDENTITY CASCADE
  `);
});
