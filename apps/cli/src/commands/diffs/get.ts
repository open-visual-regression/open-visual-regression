import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { downloadImages } from "../../download";
import { formatCliError } from "../../errors";
import { formatDiffOutput } from "./detail";

type DiffsGetCommandOptions = {
  serverUrl?: string;
  config?: string;
  json?: boolean;
  download?: string;
};

export const getCommand = new Command("get")
  .description("Show a snapshot's diff against its baseline")
  .argument("<snapshotId>", "snapshot id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the diff as JSON instead of formatted text")
  .option("--download <dir>", "save the baseline, new and diff images to this directory")
  .action(async (snapshotId: string, options: DiffsGetCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { diff } = await client.diffs.getOne({ snapshotId });

      console.log(formatDiffOutput(diff, options.json));

      if (options.download) {
        const { snapshot } = await client.snapshots.getOne({ snapshotId });
        const files = await downloadImages(client, options.download, [
          { name: "baseline", imagePath: diff?.baselineSnapshot?.imagePath ?? null },
          { name: "new", imagePath: snapshot.imagePath },
          { name: "diff", imagePath: diff?.diffImagePath ?? null },
        ]);

        files.forEach((file) => console.error(`Saved ${file}`));
      }
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
