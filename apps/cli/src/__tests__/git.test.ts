import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getRepoRoot, isShallowRepository, listAncestorCommits, listChangedFiles } from "../git";

let repo: string;

const git = (...args: string[]): string =>
  execFileSync("git", args, { cwd: repo, encoding: "utf-8" }).trim();

const write = async (file: string, contents = file): Promise<void> => {
  await mkdir(path.join(repo, path.dirname(file)), { recursive: true });
  await writeFile(path.join(repo, file), contents);
};

const commit = async (files: Record<string, string>): Promise<string> => {
  for (const [file, contents] of Object.entries(files)) {
    await write(file, contents);
  }
  git("add", "-A");
  git("commit", "-q", "-m", "change");
  return git("rev-parse", "HEAD");
};

beforeEach(async () => {
  repo = await realpath(await mkdtemp(path.join(tmpdir(), "ovr-cli-git-")));
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  git("config", "commit.gpgsign", "false");
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe("git", () => {
  it("finds the repository root from a subdirectory", async () => {
    await commit({ "apps/web/a.ts": "a" });

    expect(await getRepoRoot(path.join(repo, "apps/web"))).toBe(repo);
  });

  it("lists commits reachable from head, newest first", async () => {
    const first = await commit({ "a.ts": "1" });
    const second = await commit({ "a.ts": "2" });
    const third = await commit({ "a.ts": "3" });

    expect(await listAncestorCommits(repo, "HEAD", 10)).toEqual([third, second, first]);
    expect(await listAncestorCommits(repo, "HEAD", 2)).toEqual([third, second]);
  });

  it("reports a full clone as not shallow", async () => {
    await commit({ "a.ts": "1" });

    expect(await isShallowRepository(repo)).toBe(false);
  });

  it("lists files changed since a commit, relative to the repository root", async () => {
    const base = await commit({ "apps/web/a.ts": "1", "apps/web/b.ts": "1" });
    await commit({ "apps/web/a.ts": "2", "packages/ui/c.css": "1" });

    const changed = await listChangedFiles(path.join(repo, "apps/web"), base);

    expect(changed.sort()).toEqual(["apps/web/a.ts", "packages/ui/c.css"]);
  });

  it("includes uncommitted and untracked files, since the build used the working tree", async () => {
    const base = await commit({ "a.ts": "1", "b.ts": "1" });
    await write("a.ts", "edited");
    await write("new file.ts", "untracked");

    expect((await listChangedFiles(repo, base)).sort()).toEqual(["a.ts", "new file.ts"]);
  });

  it("reports both sides of a rename", async () => {
    const base = await commit({ "src/old.ts": "same contents that git can match as a rename" });
    git("mv", "src/old.ts", "src/new.ts");
    git("commit", "-q", "-m", "rename");

    expect((await listChangedFiles(repo, base)).sort()).toEqual(["src/new.ts", "src/old.ts"]);
  });

  it("ignores untracked files that are gitignored", async () => {
    const base = await commit({ ".gitignore": "storybook-static\n" });
    await write("storybook-static/index.json", "{}");

    expect(await listChangedFiles(repo, base)).toEqual([]);
  });
});
