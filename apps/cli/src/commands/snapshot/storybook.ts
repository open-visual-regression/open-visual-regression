import { Command } from "commander";

import { createClient } from "../../client";
import { getApiKey } from "../../config";
import { createArtifactTarball, uploadArtifact } from "./artifact";
import { detectBranch, detectCommitSha } from "./git";
import {
  BuildFailedError,
  BuildNeedsReviewError,
  BuildTimeoutError,
  pollBuildStatus,
} from "./poll";
import { readStoryIds } from "./storybookIndex";

type StorybookCommandOptions = {
  dir: string;
  serverUrl: string;
  branch?: string;
  commit?: string;
  timeout: string;
};

export const storybookCommand = new Command("storybook")
  .description("Snapshot a Storybook static build")
  .requiredOption("-d, --dir <path>", "path to storybook-static output directory")
  .requiredOption("--server-url <url>", "OVR server URL")
  .option("--branch <name>", "branch name (default: auto-detected from git or CI environment)")
  .option("--commit <sha>", "commit SHA (default: auto-detected from git or CI environment)")
  .option("--timeout <seconds>", "maximum seconds to wait for build result", "600")
  .action(async (options: StorybookCommandOptions) => {
    const apiKey = getApiKey();

    try {
      const targets = await readStoryIds(options.dir);
      const branch = options.branch ?? detectBranch();
      const commitSha = options.commit ?? detectCommitSha();

      const client = createClient(options.serverUrl, apiKey);

      console.log(`Creating build for ${branch}@${commitSha} (${targets.length} stories)...`);
      const { buildId, uploadUrl } = await client.builds.createBuild({
        branch,
        commitSha,
        targets,
      });

      console.log("Uploading build artifact...");
      const artifact = await createArtifactTarball(options.dir);
      await uploadArtifact(uploadUrl, artifact);

      console.log(`Build ${buildId} created. Waiting for result...`);
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
        console.error(error instanceof Error ? error.message : String(error));
      }

      process.exit(1);
    }
  });
