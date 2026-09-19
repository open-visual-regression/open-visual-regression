import { Command } from "commander";

import { buildStatusSchema, type BuildsCursor } from "@ovr/api/contracts/builds";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { decodeBuildsCursor, encodeBuildsCursor } from "../../cursor";
import { formatCliError } from "../../errors";
import { MAX_LIMIT, parseEnumOption, parseLimit } from "../../filters";
import { collectAllPages } from "../../paginate";
import { formatBuildsOutput } from "./table";

const SORT_DIRECTIONS = ["asc", "desc"] as const;

const DEFAULT_LIMIT = "20";

type BuildsListCommandOptions = {
  serverUrl?: string;
  branch?: string[];
  commit?: string[];
  status?: string[];
  author?: string[];
  search?: string;
  sort?: string;
  limit: string;
  cursor?: string;
  all?: boolean;
  config?: string;
  json?: boolean;
};

export const listCommand = new Command("list")
  .description("List builds")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("--branch <name...>", "filter to builds on these branches")
  .option("--commit <sha...>", "filter to builds for these commits")
  .option("--status <status...>", "filter to builds with these statuses")
  .option("--author <author...>", "filter to builds by these authors")
  .option("--search <text>", "filter to builds matching this text")
  .option("--sort <direction>", "sort by creation time: asc or desc")
  .option("--limit <count>", `builds per page (1-${MAX_LIMIT})`, DEFAULT_LIMIT)
  .option("--cursor <cursor>", "fetch the page following this cursor")
  .option("--all", "fetch every page instead of just the first")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print results as JSON instead of a table")
  .action(async (options: BuildsListCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const [sortDirection] =
        parseEnumOption("--sort", options.sort ? [options.sort] : undefined, SORT_DIRECTIONS) ?? [];

      const listInput = {
        branches: options.branch,
        commitShas: options.commit,
        statuses: parseEnumOption("--status", options.status, buildStatusSchema.options),
        authors: options.author,
        search: options.search,
        sortDirection,
        limit: parseLimit(options.limit),
      };

      const client = createClient(serverUrl, apiKey);

      let total = 0;

      const fetchPage = async (cursor: BuildsCursor | undefined) => {
        const result = await client.builds.list({ ...listInput, cursor });

        total = result.total;

        return { items: result.builds, nextCursor: result.nextCursor };
      };

      const { items: builds, nextCursor } = options.all
        ? await collectAllPages({ fetchPage })
        : await fetchPage(options.cursor ? decodeBuildsCursor(options.cursor) : undefined);

      console.log(
        formatBuildsOutput(
          {
            builds,
            total,
            nextCursor: nextCursor ? encodeBuildsCursor(nextCursor) : null,
            filters: {
              branch: options.branch,
              commit: options.commit,
              status: options.status,
              author: options.author,
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
