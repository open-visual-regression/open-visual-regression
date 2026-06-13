import { execSync } from "node:child_process";

const exec = (command: string): string => execSync(command, { encoding: "utf-8" }).trim();

export const detectBranch = (): string =>
  process.env.GITHUB_REF_NAME ?? process.env.CI_COMMIT_BRANCH ?? exec("git branch --show-current");

export const detectCommitSha = (): string =>
  process.env.GITHUB_SHA ?? process.env.CI_COMMIT_SHA ?? exec("git rev-parse HEAD");
