import { Command } from "commander";

import type { DiffReviewStatusSchema, DiffReviewVoteSchema } from "@ovr/api/contracts/diffs";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";

type DiffsVoteCommandOptions = {
  serverUrl?: string;
  config?: string;
};

const VOTED: Record<DiffReviewVoteSchema, string> = { approve: "Approved", reject: "Rejected" };

export const formatDiffVoteOutput = (
  vote: DiffReviewVoteSchema,
  snapshotId: string,
  reviewStatus: DiffReviewStatusSchema,
): string => `${VOTED[vote]} snapshot ${snapshotId}. Its review status is now ${reviewStatus}.`;

export const createVoteCommand = (vote: DiffReviewVoteSchema): Command =>
  new Command(vote)
    .description(`${vote === "approve" ? "Approve" : "Reject"} a snapshot's diff`)
    .argument("<snapshotId>", "snapshot id")
    .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
    .option("-c, --config <path>", "path to ovr.config file")
    .action(async (snapshotId: string, options: DiffsVoteCommandOptions) => {
      const apiKey = getApiKey();
      const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

      try {
        const client = createClient(serverUrl, apiKey);

        const { diff } = await client.diffs.getOne({ snapshotId });

        if (!diff) {
          throw new Error(`Snapshot ${snapshotId} has no diff to review.`);
        }

        await client.diffs.castVote({ diffId: diff.id, vote });

        const { diff: reviewed } = await client.diffs.getOne({ snapshotId });

        console.log(
          formatDiffVoteOutput(vote, snapshotId, reviewed?.reviewStatus ?? diff.reviewStatus),
        );
      } catch (error) {
        console.error(formatCliError(error, serverUrl));
        process.exit(1);
      }
    });
