import { Command } from "commander";

import { snapshotDisplayStatusSchema, type SnapshotDisplayStatus } from "@ovr/api/contracts/builds";
import {
  MAX_REBUILD_SNAPSHOTS,
  snapshotFlagSchema,
  type SnapshotsCursor,
} from "@ovr/api/contracts/snapshots";

import { chunk } from "../../chunk";
import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { MAX_LIMIT, parseEnumOption } from "../../filters";
import { collectAllPages } from "../../paginate";

// The server refuses to rebuild a snapshot that is still being captured or whose story is skipped.
const UNREBUILDABLE_STATUSES: SnapshotDisplayStatus[] = ["queued", "processing", "skipped"];

type SnapshotsRebuildCommandOptions = {
  serverUrl?: string;
  status?: string[];
  browser?: string[];
  viewport?: string[];
  flag?: string[];
  search?: string;
  config?: string;
  json?: boolean;
};

type RebuildCandidate = { id: string; status: SnapshotDisplayStatus };

export const selectRebuildableSnapshots = (snapshots: RebuildCandidate[]) => {
  const rebuildable = snapshots.filter(
    (snapshot) => !UNREBUILDABLE_STATUSES.includes(snapshot.status),
  );

  return {
    snapshotIds: rebuildable.map((snapshot) => snapshot.id),
    leftOut: snapshots.length - rebuildable.length,
  };
};

export const formatSnapshotsRebuildOutput = (
  result: { buildId: string; snapshotIds: string[]; leftOut: number },
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify({ buildId: result.buildId, snapshotIds: result.snapshotIds }, null, 2);
  }

  const lines =
    result.snapshotIds.length === 0
      ? ["No snapshots to rebuild."]
      : [
          `Rebuilding ${result.snapshotIds.length} snapshot${result.snapshotIds.length === 1 ? "" : "s"} in build ${result.buildId}`,
        ];

  if (result.leftOut > 0) {
    lines.push(
      `Left out ${result.leftOut} that ${result.leftOut === 1 ? "is" : "are"} queued, processing, or skipped.`,
    );
  }

  return lines.join("\n");
};

export const rebuildCommand = new Command("rebuild")
  .description("Capture some of a build's snapshots again, by id or by filter")
  .argument("<buildId>", "build id")
  .argument("[snapshotIds...]", "snapshot ids to rebuild; omit to choose them with filters")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("--status <status...>", "rebuild snapshots with these statuses")
  .option("--browser <name...>", "rebuild snapshots captured in these browsers")
  .option("--viewport <name...>", "rebuild snapshots captured at these viewports")
  .option("--flag <flag...>", "rebuild snapshots with these flags")
  .option("--search <text>", "rebuild snapshots matching this text")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--json", "print the rebuilt snapshot ids as JSON")
  .action(
    async (buildId: string, snapshotIds: string[], options: SnapshotsRebuildCommandOptions) => {
      const apiKey = getApiKey();
      const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

      try {
        const filters = {
          statuses: parseEnumOption(
            "--status",
            options.status,
            snapshotDisplayStatusSchema.options,
          ),
          browsers: options.browser,
          viewports: options.viewport,
          flags: parseEnumOption("--flag", options.flag, snapshotFlagSchema.options),
          search: options.search,
        };
        const hasFilters = Object.values(filters).some((value) => value !== undefined);

        if (snapshotIds.length > 0 && hasFilters) {
          throw new Error("Pass snapshot ids or filters, not both.");
        }

        if (snapshotIds.length === 0 && !hasFilters) {
          throw new Error(
            "Pass the snapshot ids to rebuild, or filters such as --status error to choose them. To rebuild every snapshot, use ovr builds rebuild.",
          );
        }

        const client = createClient(serverUrl, apiKey);

        const findMatchingSnapshots = async () => {
          const { items } = await collectAllPages({
            fetchPage: async (cursor: SnapshotsCursor | undefined) => {
              const result = await client.snapshots.list({
                ...filters,
                buildId,
                limit: MAX_LIMIT,
                cursor,
              });

              return { items: result.snapshots, nextCursor: result.nextCursor };
            },
          });

          return selectRebuildableSnapshots(items);
        };

        const selected =
          snapshotIds.length > 0 ? { snapshotIds, leftOut: 0 } : await findMatchingSnapshots();

        for (const batch of chunk(selected.snapshotIds, MAX_REBUILD_SNAPSHOTS)) {
          await client.snapshots.rebuild({ buildId, snapshotIds: batch });
        }

        console.log(formatSnapshotsRebuildOutput({ buildId, ...selected }, options.json));
      } catch (error) {
        console.error(formatCliError(error, serverUrl));
        process.exit(1);
      }
    },
  );
