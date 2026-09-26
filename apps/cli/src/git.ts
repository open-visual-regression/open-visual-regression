import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const git = async (cwd: string, args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 });
  return stdout;
};

const splitNul = (output: string): string[] => output.split("\0").filter(Boolean);

export const getRepoRoot = async (cwd: string): Promise<string> =>
  (await git(cwd, ["rev-parse", "--show-toplevel"])).trim();

export const isShallowRepository = async (cwd: string): Promise<boolean> =>
  (await git(cwd, ["rev-parse", "--is-shallow-repository"])).trim() === "true";

/** Commits reachable from `head`, newest first. */
export const listAncestorCommits = async (
  cwd: string,
  head: string,
  limit: number,
): Promise<string[]> =>
  (await git(cwd, ["rev-list", `--max-count=${limit}`, head])).split("\n").filter(Boolean);

/**
 * Files that differ between `base` and the working tree, relative to the repository root. The
 * working tree is what was just built, so uncommitted and untracked files count too. Renames are
 * reported as their old and new paths so a removed file is never missed.
 */
export const listChangedFiles = async (cwd: string, base: string): Promise<string[]> => {
  const root = await getRepoRoot(cwd);
  const [changed, untracked] = await Promise.all([
    git(root, ["diff", "--name-only", "--no-renames", "-z", base, "--"]),
    git(root, ["ls-files", "--others", "--exclude-standard", "-z"]),
  ]);

  return [...new Set([...splitNul(changed), ...splitNul(untracked)])];
};
