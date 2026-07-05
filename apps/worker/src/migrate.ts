import { runMigrations } from "@ovr/db/migrate";
import { buildDatabaseUrl } from "@ovr/db/url";

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
