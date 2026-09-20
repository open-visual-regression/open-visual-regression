import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { formatSnapshotCountsOutput } from "./snapshotCounts";

type SnapshotsCountsCommandOptions = {
  serverUrl?: string;
  config?: string;
  json?: boolean;
};

export const countsCommand = new Command("counts")
  .description("Count a build's snapshots by status")
  .argument("<buildId>", "build id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the counts as JSON instead of a table")
  .action(async (buildId: string, options: SnapshotsCountsCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const counts = await client.snapshots.getCounts({ buildId });

      console.log(formatSnapshotCountsOutput(counts, options.json));
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
