import { ORPCError } from "@orpc/client";
import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey } from "../../config";
import { formatBuildDetail } from "./detail";

type BuildsGetCommandOptions = {
  serverUrl: string;
};

export const getCommand = new Command("get")
  .description("Show a single build")
  .argument("<buildId>", "build id")
  .requiredOption("--server-url <url>", "OVR server URL")
  .action(async (buildId: string, options: BuildsGetCommandOptions) => {
    const apiKey = getApiKey();

    try {
      const client = createClient(options.serverUrl, apiKey);

      const { build } = await client.builds.getOne({ buildId });

      console.log(
        formatBuildDetail({
          id: build.id,
          status: build.status,
          branch: build.branch,
          commitSha: build.commitSha,
          project: build.project.name,
          name: build.name,
          author: build.author,
          createdAt: build.createdAt,
          errorMessage: build.errorMessage,
          canceledBy: build.canceledBy,
        }),
      );
    } catch (error) {
      if (error instanceof ORPCError) {
        console.error(
          `Request to ${options.serverUrl} failed: ${error.status} ${error.code} - ${error.message}`,
        );
      } else {
        console.error(error instanceof Error ? error.message : String(error));
      }

      process.exit(1);
    }
  });
