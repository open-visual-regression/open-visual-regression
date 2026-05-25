import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export { sql } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client);
