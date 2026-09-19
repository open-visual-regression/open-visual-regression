import { Command } from "commander";

import { readStoryTargets } from "@ovr/storybook-compat/manifest";

import { createClient } from "../../client";
import {
  getApiKey,
  getServerUrl,
  loadOvrConfig,
  resolveDiffThreshold,
  resolveViewports,
} from "../../config";
import { formatCliError } from "../../errors";
import { createArtifactTarball, uploadArtifact } from "./artifact";
import {
  BuildFailedError,
  BuildNeedsReviewError,
  BuildTimeoutError,
  pollBuildStatus,
} from "./poll";

type StorybookCommandOptions = {
  dir: string;
  serverUrl?: string;
  branch: string;
  commit: string;
  name?: string;
  author?: string;
  wait?: boolean;
  timeout: string;
  config?: string;
};

/** A Command instance can only have one parent, so each group builds its own. */
export const createStorybookCommand = (): Command =>
  new Command("storybook")
    .description("Upload a Storybook static build to snapshot")
    .requiredOption("-d, --dir <path>", "path to storybook-static output directory")
    .option("--server-url <url>", "OVR server URL (defaults to ovr.config's serverUrl)")
    .requiredOption("--branch <name>", "branch name")
    .requiredOption("--commit <sha>", "commit SHA")
    .option("--name <name>", "build name (e.g. commit message)")
    .option("--author <author>", "commit author")
    .option("--wait", "wait for the build to finish processing before exiting")
    .option("--timeout <seconds>", "maximum seconds to wait for build result (with --wait)", "600")
    .option("-c, --config <path>", "path to ovr.config file")
    .action(async (options: StorybookCommandOptions) => {
      const apiKey = getApiKey();
      const serverUrl = await getServerUrl(process.cwd(), options.serverUrl, options.config);

      try {
        const targets = await readStoryTargets(options.dir);
        const config = await loadOvrConfig(process.cwd(), options.config);
        const viewports = resolveViewports(config);
        const diffThreshold = resolveDiffThreshold(config);
        const { branch, commit: commitSha, name, author } = options;

        const client = createClient(serverUrl, apiKey);

        console.log(`Creating build for ${branch}@${commitSha} (${targets.length} stories)...`);
        const { buildId, uploadUrl, buildUrl } = await client.builds.createBuild({
          branch,
          commitSha,
          name,
          author,
          buildType: "storybook",
        });

        console.log("Uploading build artifact...");
        const artifact = await createArtifactTarball(options.dir);
        await uploadArtifact(uploadUrl, artifact);

        await client.builds.confirmUpload({ buildId, targets, viewports, diffThreshold });

        console.log(`Build published: ${buildUrl}`);

        if (!options.wait) {
          process.exit(0);
        }

        console.log("Waiting for result...");
        await pollBuildStatus({
          client,
          buildId,
          timeoutSeconds: Number(options.timeout),
          onPoll: (status) => console.log(`  status: ${status}`),
        });

        console.log("Build passed.");
        process.exit(0);
      } catch (error) {
        if (error instanceof BuildNeedsReviewError) {
          console.error(error.message);
        } else if (error instanceof BuildFailedError) {
          console.error(error.message);
        } else if (error instanceof BuildTimeoutError) {
          console.error(error.message);
        } else {
          console.error(formatCliError(error, serverUrl));
        }

        process.exit(1);
      }
    });
