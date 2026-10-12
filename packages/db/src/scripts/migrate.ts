/// <reference types="node" />

import { config } from "dotenv";

import { runMigrations } from "@ovr/db/migrate";
import { buildDatabaseUrl } from "@ovr/db/url";
import { createLogger } from "@ovr/logger";

const logger = createLogger("migrate");

config({ path: "../../.env.development.local" });
config({ path: "../../.env.local" });
config({ path: "../../.env" });

const main = async () => {
  await runMigrations(buildDatabaseUrl(), process.env.OVR_MIGRATIONS_DIR);
  logger.info("database migrations applied");
};

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    logger.error({ err: error }, "failed to apply database migrations");
    process.exit(1);
  });
