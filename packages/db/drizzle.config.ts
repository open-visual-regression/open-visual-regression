/// <reference types="node" />

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { buildDatabaseUrl } from "./src/url";

// Load env from monorepo root (works when run from packages/db)
config({ path: "../../.env.development.local" });
config({ path: "../../.env.local" });
config({ path: "../../.env" });

export default defineConfig({
  schema: "./src/schema/**/*.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: { url: buildDatabaseUrl() },
});
