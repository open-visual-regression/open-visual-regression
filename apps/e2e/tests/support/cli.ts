import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { getBaseURL } from "../constants";

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const CLI_ENTRY = process.env.OVR_CLI_ENTRY ?? path.join(REPO_ROOT, "apps/cli/dist/index.js");

export type OvrCliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export const runOvr = async (args: string[], apiKey: string): Promise<OvrCliResult> => {
  const fullArgs = [CLI_ENTRY, ...args, "--server-url", getBaseURL()];
  const options = { env: { ...process.env, OVR_API_KEY: apiKey }, maxBuffer: 10 * 1024 * 1024 };

  try {
    const { stdout, stderr } = await execFileAsync("node", fullArgs, options);
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number | string; stdout?: string; stderr?: string };
    return {
      exitCode: typeof failure.code === "number" ? failure.code : 1,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? "",
    };
  }
};
