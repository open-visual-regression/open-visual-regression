import { Command } from "commander";
import { v7 as uuidv7 } from "uuid";

import { readStoryTargets } from "@ovr/storybook-compat/manifest";
import { STATS_FILENAME } from "@ovr/storybook-compat/moduleGraph";

import { createClient } from "../../client";
import {
  getApiKey,
  getServerUrl,
  loadOvrConfig,
  resolveDiffThreshold,
  resolveViewports,
  resolveWaitForTimeout,
} from "../../config";
import { formatCliError, runStep } from "../../errors";
import { findUnaffectedTargets } from "./affected";
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
  onlyAffected?: boolean;
  timeout: string;
  config?: string;
};

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
    .option(
      "--only-affected",
      "only capture stories affected by changes since the last main-branch build (needs storybook build --stats-json)",
    )
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
        const waitForTimeout = resolveWaitForTimeout(config);
        const { branch, commit: commitSha, name, author } = options;

        const client = createClient(serverUrl, apiKey);

        const unaffectedTargetIds = options.onlyAffected
          ? await findUnaffectedTargets({
              client,
              storybookDir: options.dir,
              cwd: process.cwd(),
              targets,
              config: config?.onlyAffected,
            })
          : [];

        console.log(`Creating build for ${branch}@${commitSha} (${targets.length} stories)...`);
        const { buildId, uploadUrl, buildUrl } = await runStep("creating the build", () =>
          client.builds.createBuild({
            buildId: uuidv7(),
            branch,
            commitSha,
            name,
            author,
            buildType: "storybook",
          }),
        );

        console.log("Uploading build artifact...");
        const artifact = await createArtifactTarball(options.dir, [STATS_FILENAME]);
        await runStep("uploading the build artifact", () => uploadArtifact(uploadUrl, artifact));

        await runStep("confirming the upload", () =>
          client.builds.confirmUpload({
            buildId,
            targets,
            viewports,
            diffThreshold,
            ...(waitForTimeout > 0 && { waitForTimeout }),
            ...(unaffectedTargetIds.length > 0 && { unaffectedTargetIds }),
          }),
        );

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
