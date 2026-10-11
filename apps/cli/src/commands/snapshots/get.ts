import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { downloadImages } from "../../download";
import { formatCliError } from "../../errors";
import { formatSnapshotOutput } from "./detail";

type SnapshotsGetCommandOptions = {
  serverUrl?: string;
  config?: string;
  json?: boolean;
  download?: string;
};

export const getCommand = new Command("get")
  .description("Show a single snapshot")
  .argument("<snapshotId>", "snapshot id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the snapshot as JSON instead of formatted text")
  .option("--download <dir>", "save the snapshot image to this directory")
  .action(async (snapshotId: string, options: SnapshotsGetCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { snapshot } = await client.snapshots.getOne({ snapshotId });

      console.log(formatSnapshotOutput(snapshot, options.json));

      if (options.download) {
        const files = await downloadImages(client, options.download, [
          { name: "snapshot", imagePath: snapshot.imagePath },
        ]);

        files.forEach((file) => console.error(`Saved ${file}`));
      }
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
