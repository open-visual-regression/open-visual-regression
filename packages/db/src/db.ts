import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
export { sql } from "drizzle-orm";

import { createLogger } from "@ovr/logger";

import * as schema from "./schema";
import { buildDatabaseUrl } from "./url";

const logger = createLogger("db");

const client = new Pool({ connectionString: buildDatabaseUrl() });

client.on("error", (error) => {
  logger.error({ err: error }, "idle database client errored");
});

export const db = drizzle({ schema, client, casing: "snake_case" });

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DbClient = typeof db | Transaction;
