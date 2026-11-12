import { Command } from "commander";

import { createClient, type OvrClient } from "../../client";
import { getApiKey, getServerUrl } from "../../config";
import { formatCliError } from "../../errors";
import { pollBuildStatus } from "../upload/poll";

type BuildsRebuildCommandOptions = {
  serverUrl?: string;
  config?: string;
  wait?: boolean;
  timeout: string;
  json?: boolean;
};

// getBuildStatus only accepts a project API key, so read the status from the build itself,
// which an access token can read.
export const readStatusFromBuild = (client: { builds: Pick<OvrClient["builds"], "getOne"> }) => ({
  builds: {
    getBuildStatus: async ({ buildId }: { buildId: string }) => {
      const { build } = await client.builds.getOne({ buildId });

      return { status: build.status, errorMessage: build.errorMessage ?? undefined };
    },
  },
});

export const formatRebuildOutput = (buildId: string, json: boolean | undefined): string =>
  json ? JSON.stringify({ buildId }, null, 2) : `Rebuilding as build ${buildId}`;

export const rebuildCommand = new Command("rebuild")
  .description("Capture a finished build again as a new build")
  .argument("<buildId>", "build id")
  .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
  .option("-c, --config <path>", "path to ovr.config file")
  .option("--wait", "wait for the new build to finish processing before exiting")
  .option("--timeout <seconds>", "maximum seconds to wait for build result (with --wait)", "600")
  .option("--json", "print the new build's id as JSON")
  .action(async (buildId: string, options: BuildsRebuildCommandOptions) => {
    const apiKey = getApiKey();
    const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

    try {
      const client = createClient(serverUrl, apiKey);

      const { buildId: newBuildId } = await client.builds.rebuild({ buildId });

      console.log(formatRebuildOutput(newBuildId, options.json));

      if (!options.wait) {
        return;
      }

      console.error("Waiting for result...");
      await pollBuildStatus({
        client: readStatusFromBuild(client),
        buildId: newBuildId,
        timeoutSeconds: Number(options.timeout),
        onPoll: (status) => console.error(`  status: ${status}`),
      });

      console.error("Build passed.");
    } catch (error) {
      console.error(formatCliError(error, serverUrl));
      process.exit(1);
    }
  });
