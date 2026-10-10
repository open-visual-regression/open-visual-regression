import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { downloadImages } from "../../download";
import { formatCliError } from "../../errors";
import { analyzeImages, formatDiffAnalysis } from "./analysis";
import { formatDiffOutput } from "./detail";

type DiffsGetCommandOptions = {
  serverUrl?: string;
  config?: string;
  json?: boolean;
  download?: string;
  analyze?: boolean;
};

export const getCommand = new Command("get")
  .description("Show a snapshot's diff against its baseline")
  .argument("<snapshotId>", "snapshot id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the diff as JSON instead of formatted text")
  .option("--download <dir>", "save the baseline, new and diff images to this directory")
  .option("--analyze", "describe what changed, such as content that moved")
  .action(async (snapshotId: string, options: DiffsGetCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { diff } = await client.diffs.getOne({ snapshotId });
      const snapshot =
        options.download || options.analyze
          ? (await client.snapshots.getOne({ snapshotId })).snapshot
          : null;
      const baselineImagePath = diff?.baselineSnapshot?.imagePath ?? null;
      const analysis = options.analyze
        ? await analyzeImages(client, baselineImagePath, snapshot?.imagePath ?? null)
        : null;

      if (options.json && analysis) {
        console.log(JSON.stringify({ ...diff, analysis }, null, 2));
      } else {
        console.log(formatDiffOutput(diff, options.json));
      }

      if (analysis && !options.json) {
        console.log(`\n${formatDiffAnalysis(analysis)}`);
      }

      if (options.download) {
        const files = await downloadImages(client, options.download, [
          { name: "baseline", imagePath: baselineImagePath },
          { name: "new", imagePath: snapshot?.imagePath ?? null },
          { name: "diff", imagePath: diff?.diffImagePath ?? null },
        ]);

        files.forEach((file) => console.error(`Saved ${file}`));
      }
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
