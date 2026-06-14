import { execSync } from "node:child_process";

const exec = (command: string): string => execSync(command, { encoding: "utf-8" }).trim();

export const detectBranch = (): string => exec("git branch --show-current");

export const detectCommitSha = (): string => exec("git rev-parse HEAD");
