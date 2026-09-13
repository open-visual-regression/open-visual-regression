import { ORPCError } from "@orpc/client";
import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatBuildDetail } from "./detail";

type BuildsGetCommandOptions = {
  serverUrl?: string;
  config?: string;
};

export const getCommand = new Command("get")
  .description("Show a single build")
  .argument("<buildId>", "build id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .action(async (buildId: string, options: BuildsGetCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

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
          `Request to ${serverUrl} failed: ${error.status} ${error.code} - ${error.message}`,
        );
      } else {
        console.error(error instanceof Error ? error.message : String(error));
      }

      process.exit(1);
    }
  });
