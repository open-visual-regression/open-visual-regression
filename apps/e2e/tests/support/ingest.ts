import { execFile, spawn, type ChildProcess } from "node:child_process";
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
  wait?: boolean;
};

export type IngestResult = {
  commitSha: string;
  shortSha: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

const buildArgs = (commitSha: string, options: IngestOptions): string[] => [
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
  options.name ?? `e2e ingest ${commitSha.slice(0, 7)}`,
  ...((options.wait ?? true) ? ["--wait", "--timeout", "600"] : []),
];

// Starts an ingest without waiting for it to finish, so a caller can observe the
// build while it is still processing.
export const spawnIngest = (options: IngestOptions & { commitSha: string }): ChildProcess =>
  spawn("node", buildArgs(options.commitSha, options), {
    cwd: STORYBOOK_PKG_DIR,
    env: { ...process.env, OVR_API_KEY: options.apiKey },
  });

// Ingests the Storybook build via the CLI and returns the outcome without
// throwing, so callers can assert on any exit code (e.g. a needs-review build).
export const ingestStorybook = async (options: IngestOptions): Promise<IngestResult> => {
  const commitSha = options.commitSha ?? randomBytes(20).toString("hex");
  const shortSha = commitSha.slice(0, 7);

  const options_ = {
    cwd: STORYBOOK_PKG_DIR,
    env: { ...process.env, OVR_API_KEY: options.apiKey },
    maxBuffer: 10 * 1024 * 1024,
  };

  try {
    const { stdout, stderr } = await execFileAsync("node", buildArgs(commitSha, options), options_);
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
