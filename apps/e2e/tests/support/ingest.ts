import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";

import { getBaseURL } from "../constants";

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const CLI_ENTRY = process.env.OVR_CLI_ENTRY ?? path.join(REPO_ROOT, "apps/cli/dist/index.js");
// Run the CLI from this dir so it picks up the package's ovr.config viewports.
const STORYBOOK_PKG_DIR = process.env.OVR_STORYBOOK_PKG_DIR ?? path.join(REPO_ROOT, "packages/ui");
const STORYBOOK_DIR =
  process.env.OVR_STORYBOOK_DIR ?? path.join(STORYBOOK_PKG_DIR, "storybook-static");

export type IngestOptions = {
  apiKey: string;
  branch?: string;
  commitSha?: string;
  name?: string;
};

export type IngestResult = {
  commitSha: string;
  shortSha: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

// Ingests the Storybook build via the CLI and returns the outcome without
// throwing, so callers can assert on any exit code (e.g. a needs-review build).
export const ingestStorybook = async (options: IngestOptions): Promise<IngestResult> => {
  const commitSha = options.commitSha ?? randomBytes(20).toString("hex");
  const shortSha = commitSha.slice(0, 7);

  const args = [
    CLI_ENTRY,
    "snapshot",
    "storybook",
    "--dir",
    STORYBOOK_DIR,
    "--server-url",
    getBaseURL(),
    "--branch",
    options.branch ?? "main",
    "--commit",
    commitSha,
    "--name",
    options.name ?? `e2e ingest ${shortSha}`,
    "--timeout",
    "600",
  ];

  const options_ = {
    cwd: STORYBOOK_PKG_DIR,
    env: { ...process.env, OVR_API_KEY: options.apiKey },
    maxBuffer: 10 * 1024 * 1024,
  };

  try {
    const { stdout, stderr } = await execFileAsync("node", args, options_);
    return { commitSha, shortSha, exitCode: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number | string; stdout?: string; stderr?: string };
    return {
      commitSha,
      shortSha,
      exitCode: typeof failure.code === "number" ? failure.code : 1,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? "",
    };
  }
};
