import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";

type BuildsCancelCommandOptions = {
  serverUrl?: string;
  config?: string;
};

export const cancelCommand = new Command("cancel")
  .description("Cancel a queued or processing build")
  .argument("<buildId>", "build id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .action(async (buildId: string, options: BuildsCancelCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      await client.builds.cancel({ buildId });

      console.log(`Canceled build ${buildId}`);
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
