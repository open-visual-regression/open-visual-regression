import { readFile, writeFile } from "node:fs/promises";

import { Command } from "commander";

import { diffImages } from "@ovr/image-diff/diffImages";
import { decodePng, encodePng } from "@ovr/image-diff/png";

import { loadDiffThreshold } from "../../config";
import { formatCliError } from "../../errors";
import { parseThreshold } from "../../filters";
import { formatComparisonOutput, isUnchanged } from "./comparison";

type DiffsCompareCommandOptions = {
  out?: string;
  threshold?: string;
  config?: string;
  json?: boolean;
};

export const compareCommand = new Command("compare")
  .description("Compare two PNG files locally, the same way the server diffs a snapshot")
  .argument("<baseline>", "path to the baseline PNG")
  .argument("<capture>", "path to the PNG to compare against it")
  .option("--out <file>", "write the diff mask to this PNG file")
  .option("--threshold <fraction>", "override ovr.config's diffThreshold")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the comparison as JSON instead of formatted text")
  .action(
    async (baselinePath: string, capturePath: string, options: DiffsCompareCommandOptions) => {
      try {
        const threshold = options.threshold
          ? parseThreshold(options.threshold)
          : await loadDiffThreshold(process.cwd(), options.config);

        const [baseline, capture] = await Promise.all([
          readFile(baselinePath),
          readFile(capturePath),
        ]);

        const diff = diffImages(decodePng(baseline), decodePng(capture));

        if (options.out) {
          await writeFile(options.out, encodePng(diff.diffPixels, diff.width, diff.height));
        }

        console.log(
          formatComparisonOutput(
            { ...diff, threshold, diffImagePath: options.out ?? null },
            options.json,
          ),
        );

        process.exit(isUnchanged(diff.diffPercent, threshold) ? 0 : 1);
      } catch (error) {
        console.error(formatCliError(error, ""));
        process.exit(1);
      }
    },
  );
