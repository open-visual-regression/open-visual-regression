import { ORPCError } from "@orpc/client";
import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey } from "../../config";
import { formatBuildsTable } from "./table";

type BuildsListCommandOptions = {
  serverUrl: string;
  branch?: string;
  commit?: string;
};

export const listCommand = new Command("list")
  .description("List builds")
  .requiredOption("--server-url <url>", "OVR server URL")
  .option("--branch <name>", "filter to builds on this branch")
  .option("--commit <sha>", "filter to builds for this commit")
  .action(async (options: BuildsListCommandOptions) => {
    const apiKey = getApiKey();

    try {
      const client = createClient(options.serverUrl, apiKey);

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
          `Request to ${options.serverUrl} failed: ${error.status} ${error.code} - ${error.message}`,
        );
      } else {
        console.error(error instanceof Error ? error.message : String(error));
      }

      process.exit(1);
    }
  });
