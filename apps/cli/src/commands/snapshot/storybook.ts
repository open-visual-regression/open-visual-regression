import { Command } from "commander";

export const storybookCommand = new Command("storybook")
  .description("Snapshot a Storybook static build")
  .requiredOption("-d, --dir <path>", "path to storybook-static output directory")
  .option("--server-url <url>", "OVR server URL (overrides OVR_SERVER_URL)")
  .option("--project <slug>", "project slug (overrides OVR_PROJECT)")
  .option("--branch <name>", "branch name (default: auto-detected from git or CI environment)")
  .option("--commit <sha>", "commit SHA (default: auto-detected from git or CI environment)")
  .option("--timeout <seconds>", "maximum seconds to wait for build result", "600")
  .action(async (_options) => {
    // TODO: implement in c37
  });
