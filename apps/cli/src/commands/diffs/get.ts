import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { formatDiffOutput } from "./detail";

type DiffsGetCommandOptions = {
  serverUrl?: string;
  config?: string;
  json?: boolean;
};

export const getCommand = new Command("get")
  .description("Show a snapshot's diff against its baseline")
  .argument("<snapshotId>", "snapshot id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the diff as JSON instead of formatted text")
  .action(async (snapshotId: string, options: DiffsGetCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { diff } = await client.diffs.getOne({ snapshotId });

      console.log(formatDiffOutput(diff, options.json));
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
