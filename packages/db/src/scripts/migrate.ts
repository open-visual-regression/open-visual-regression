/// <reference types="node" />

import { config } from "dotenv";

import { runMigrations } from "@ovr/db/migrate";
import { buildDatabaseUrl } from "@ovr/db/url";

config({ path: "../../.env.development.local" });
config({ path: "../../.env.local" });
config({ path: "../../.env" });

const main = async () => {
  await runMigrations(buildDatabaseUrl(), process.env.OVR_MIGRATIONS_DIR);
  console.log("Database migrations applied successfully.");
};

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("Failed to apply database migrations:", error);
    process.exit(1);
  });
