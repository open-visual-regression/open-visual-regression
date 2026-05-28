import { test as base } from "vitest";

import { db, sql } from "@ovr/db/dbClient";

export type DbContext = {
  db: typeof db;
};

export const truncateAll = async () => {
  await db.execute(sql`
    TRUNCATE "user", organization, session, account, verification, apikey, member, invitation
    RESTART IDENTITY CASCADE
  `);
};

type DbFixtures = { dbCtx: DbContext };

export const test = base.extend<DbFixtures>({
  dbCtx: [
    async ({}, use) => {
      await truncateAll();
      await use({ db });
    },
    { scope: "test" },
  ],
});
