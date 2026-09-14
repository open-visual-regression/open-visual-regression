import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { formatBuildsOutput } from "./table";

type BuildsListCommandOptions = {
  serverUrl?: string;
  branch?: string;
  commit?: string;
  config?: string;
  json?: boolean;
};

export const listCommand = new Command("list")
  .description("List builds")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("--branch <name>", "filter to builds on this branch")
  .option("--commit <sha>", "filter to builds for this commit")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print results as JSON instead of a table")
  .action(async (options: BuildsListCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { builds } = await client.builds.list({
        branches: options.branch ? [options.branch] : undefined,
        commitShas: options.commit ? [options.commit] : undefined,
      });

      console.log(formatBuildsOutput(builds, options.json));
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
