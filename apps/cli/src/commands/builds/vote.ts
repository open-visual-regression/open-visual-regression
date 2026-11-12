import { Command } from "commander";

import type { BuildStatus } from "@ovr/api/contracts/builds";
import type { DiffReviewVoteSchema } from "@ovr/api/contracts/diffs";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";

type BuildsVoteCommandOptions = {
  serverUrl?: string;
  config?: string;
};

const VOTED: Record<DiffReviewVoteSchema, string> = { approve: "Approved", reject: "Rejected" };

export const formatBuildVoteOutput = (
  vote: DiffReviewVoteSchema,
  buildId: string,
  status: BuildStatus,
): string =>
  `${VOTED[vote]} every snapshot in build ${buildId} that needs review. The build's status is now ${status}.`;

export const createVoteCommand = (vote: DiffReviewVoteSchema): Command =>
  new Command(vote)
    .description(
      `${vote === "approve" ? "Approve" : "Reject"} every snapshot in a build that needs review`,
    )
    .argument("<buildId>", "build id")
    .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
    .option("-c, --config <path>", "path to ovr.config file")
    .action(async (buildId: string, options: BuildsVoteCommandOptions) => {
      const apiKey = getApiKey();
      const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

      try {
        const client = createClient(serverUrl, apiKey);

        await client.diffs.bulkCastVote({ buildId, vote });

        const { build } = await client.builds.getOne({ buildId });

        console.log(formatBuildVoteOutput(vote, buildId, build.status));
      } catch (error) {
        console.error(formatCliError(error, serverUrl));
        process.exit(1);
      }
    });
