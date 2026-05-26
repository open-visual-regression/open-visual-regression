import { drizzle } from "drizzle-orm/node-postgres";
import { buildDatabaseUrl } from "./url";

export { sql } from "drizzle-orm";

export const db = drizzle(buildDatabaseUrl());
