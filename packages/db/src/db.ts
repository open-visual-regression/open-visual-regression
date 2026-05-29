import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
export { sql } from "drizzle-orm";

import { buildDatabaseUrl } from "./url";
import * as schema from "./schema";

const client = new Pool({ connectionString: buildDatabaseUrl() });

export const db = drizzle({ schema, client, casing: "snake_case" });
