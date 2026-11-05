import { execFileSync } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findBaseBuild } from "../baseBuild";

let repo: string;

const git = (...args: string[]): string =>
  execFileSync("git", args, { cwd: repo, encoding: "utf-8" }).trim();

const commit = async (contents: string): Promise<string> => {
  await writeFile(path.join(repo, "file.txt"), contents);
  git("add", "-A");
  git("commit", "-q", "-m", contents);
  return git("rev-parse", "HEAD");
};

type AncestorBuild = { id: string; commitSha: string } | null;

const clientFor = (build: AncestorBuild) => ({
  builds: {
    findAncestorBuild: vi.fn<
      (input: { commitShas: string[] }) => Promise<{ build: AncestorBuild }>
    >(async () => ({ build })),
  },
});

beforeEach(async () => {
  repo = await realpath(await mkdtemp(path.join(tmpdir(), "ovr-cli-base-build-")));
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe("findBaseBuild", () => {
  it("finds the main-branch build at the commit a branch was cut from", async () => {
    const mergeBase = await commit("main");
    git("checkout", "-q", "-b", "feature");
    const head = await commit("feature");
    const client = clientFor({ id: "build-1", commitSha: mergeBase });

    const base = await findBaseBuild({
      client: client as never,
      cwd: repo,
      log: vi.fn<(message: string) => void>(),
    });

    expect(base).toEqual({ status: "found", build: { id: "build-1", commitSha: mergeBase } });
    expect(client.builds.findAncestorBuild).toHaveBeenCalledWith({
      commitShas: [head, mergeBase],
    });
  });

  it("explains why there is no base outside a git repository", async () => {
    const client = clientFor(null);

    const base = await findBaseBuild({
      client: client as never,
      cwd: repo,
      log: vi.fn<(message: string) => void>(),
    });

    expect(base).toMatchObject({
      status: "missing",
      reason: expect.stringContaining("could not read the git history"),
    });
    expect(client.builds.findAncestorBuild).not.toHaveBeenCalled();
  });
});
