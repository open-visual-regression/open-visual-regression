import { ORPCError } from "@orpc/client";
import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
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
      if (error instanceof ORPCError) {
        console.error(
          `Request to ${serverUrl} failed: ${error.status} ${error.code} - ${error.message}`,
        );
      } else {
        console.error(error instanceof Error ? error.message : String(error));
      }

      process.exit(1);
    }
  });
