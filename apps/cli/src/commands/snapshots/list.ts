import { Command } from "commander";

import { snapshotDisplayStatusSchema } from "@ovr/api/contracts/builds";
import type { SnapshotsCursor } from "@ovr/api/contracts/snapshots";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { decodeSnapshotsCursor, encodeSnapshotsCursor } from "../../cursor";
import { formatCliError } from "../../errors";
import { MAX_LIMIT, parseEnumOption, parseLimit } from "../../filters";
import { collectAllPages } from "../../paginate";
import { formatSnapshotsOutput } from "./table";

const DEFAULT_LIMIT = "24";

type SnapshotsListCommandOptions = {
  serverUrl?: string;
  status?: string[];
  browser?: string[];
  viewport?: string[];
  search?: string;
  limit: string;
  cursor?: string;
  all?: boolean;
  config?: string;
  json?: boolean;
};

export const listCommand = new Command("list")
  .description("List a build's snapshots")
  .argument("<buildId>", "build id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("--status <status...>", "filter to snapshots with these statuses")
  .option("--browser <name...>", "filter to snapshots captured in these browsers")
  .option("--viewport <name...>", "filter to snapshots captured at these viewports")
  .option("--search <text>", "filter to snapshots matching this text")
  .option("--limit <count>", `snapshots per page (1-${MAX_LIMIT})`, DEFAULT_LIMIT)
  .option("--cursor <cursor>", "fetch the page following this cursor")
  .option("--all", "fetch every page instead of just the first")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print results as JSON instead of a table")
  .action(async (buildId: string, options: SnapshotsListCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const listInput = {
        buildId,
        statuses: parseEnumOption("--status", options.status, snapshotDisplayStatusSchema.options),
        browsers: options.browser,
        viewports: options.viewport,
        search: options.search,
        limit: parseLimit(options.limit),
      };

      const client = createClient(serverUrl, apiKey);

      let total = 0;

      const fetchPage = async (cursor: SnapshotsCursor | undefined) => {
        const result = await client.snapshots.list({ ...listInput, cursor });

        total = result.total;

        return { items: result.snapshots, nextCursor: result.nextCursor };
      };

      const { items: snapshots, nextCursor } = options.all
        ? await collectAllPages({ fetchPage })
        : await fetchPage(options.cursor ? decodeSnapshotsCursor(options.cursor) : undefined);

      console.log(
        formatSnapshotsOutput(
          {
            snapshots,
            total,
            nextCursor: nextCursor ? encodeSnapshotsCursor(nextCursor) : null,
            filters: {
              status: options.status,
              browser: options.browser,
              viewport: options.viewport,
              search: options.search,
            },
          },
          options.json,
        ),
      );
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
