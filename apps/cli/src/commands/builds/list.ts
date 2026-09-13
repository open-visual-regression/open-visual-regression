import { ORPCError } from "@orpc/client";
import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey, loadServerUrl } from "../../config";
import { formatBuildsTable } from "./table";

type BuildsListCommandOptions = {
  serverUrl?: string;
  branch?: string;
  commit?: string;
  config?: string;
};

export const listCommand = new Command("list")
  .description("List builds")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("--branch <name>", "filter to builds on this branch")
  .option("--commit <sha>", "filter to builds for this commit")
  .option("-c, --config <path>", "path to ovr.config file")
  .action(async (options: BuildsListCommandOptions) => {
    const apiKey = getApiKey();
    let serverUrl: string | undefined;

    try {
      serverUrl = await loadServerUrl(process.cwd(), options.serverUrl, options.config);

      const client = createClient(serverUrl, apiKey);

      const { builds } = await client.builds.list({
        branches: options.branch ? [options.branch] : undefined,
        commitShas: options.commit ? [options.commit] : undefined,
      });

      if (builds.length === 0) {
        console.log("No builds found.");
        return;
      }

      console.log(
        formatBuildsTable(
          builds.map((build) => ({
            id: build.id,
            status: build.status,
            branch: build.branch,
            commit: build.commitSha,
            project: build.project.name,
            name: build.name ?? "",
          })),
        ),
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
