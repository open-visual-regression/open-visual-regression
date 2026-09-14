import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { formatBuildOutput } from "./detail";

type BuildsGetCommandOptions = {
  serverUrl?: string;
  config?: string;
  json?: boolean;
};

export const getCommand = new Command("get")
  .description("Show a single build")
  .argument("<buildId>", "build id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the build as JSON instead of formatted text")
  .action(async (buildId: string, options: BuildsGetCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { build } = await client.builds.getOne({ buildId });

      console.log(formatBuildOutput(build, options.json));
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
