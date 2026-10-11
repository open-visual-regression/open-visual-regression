import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { MAX_LIMIT, parseLimit } from "../../filters";
import { formatHistoryOutput } from "./historyTable";

const DEFAULT_LIMIT = "30";

type SnapshotsHistoryCommandOptions = {
  serverUrl?: string;
  branch?: string;
  limit: string;
  config?: string;
  json?: boolean;
};

export const historyCommand = new Command("history")
  .description("Show how a snapshot looked across recent builds")
  .argument("<snapshotId>", "snapshot id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("--branch <name>", "branch to look at (defaults to the project's main branch)")
  .option("--limit <count>", `number of recent builds (1-${MAX_LIMIT})`, DEFAULT_LIMIT)
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the history as JSON instead of a table")
  .action(async (snapshotId: string, options: SnapshotsHistoryCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const history = await client.snapshots.getHistory({
        snapshotId,
        branch: options.branch,
        limit: parseLimit(options.limit),
      });

      console.log(formatHistoryOutput(history, options.json));
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
