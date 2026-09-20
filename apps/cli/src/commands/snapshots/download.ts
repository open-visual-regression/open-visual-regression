import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { downloadSnapshotImages, formatDownloadOutput } from "./images";

type SnapshotsDownloadCommandOptions = {
  out: string;
  serverUrl?: string;
  config?: string;
  json?: boolean;
};

export const downloadCommand = new Command("download")
  .description("Download a snapshot's capture, baseline and diff images")
  .argument("<snapshotId>", "snapshot id")
  .option("--out <dir>", "directory to write the images into", ".")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the written paths as JSON instead of formatted text")
  .action(async (snapshotId: string, options: SnapshotsDownloadCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { urls } = await client.snapshots.getImageUrls({ snapshotId });

      const downloaded = await downloadSnapshotImages({ urls, outDir: options.out });

      console.log(formatDownloadOutput(downloaded, options.json));
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
