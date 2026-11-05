import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, test } from "./fixtures";
import { ingestStorybook, STORYBOOK_DIR } from "./support/ingest";

// Every snapshot renders differently, standing in for a change main made after a branch was cut.
const restyleStorybook = async (dir: string): Promise<string> => {
  const restyled = path.join(dir, "storybook-restyled");
  await cp(STORYBOOK_DIR, restyled, { recursive: true });
  const iframe = path.join(restyled, "iframe.html");
  const html = await readFile(iframe, "utf-8");
  await writeFile(
    iframe,
    html.replace("</head>", "<style>body { box-shadow: inset 0 0 0 8px #e11d48; }</style></head>"),
  );
  return restyled;
};

test("a branch that's behind main only shows its own changes", async ({
  buildPage,
  seedClient,
}) => {
  test.setTimeout(15 * 60 * 1000);

  const { projectId } = await seedClient.projects.add({
    projectName: `E2E Stale Branch ${Date.now()}`,
    projectDescription: "Project used by the stale branch E2E test",
    gitMainBranch: "main",
  });
  const { key: apiKey } = await seedClient.apiKeys.create({ projectId, name: "e2e-stale-branch" });

  const repo = await mkdtemp(path.join(tmpdir(), "ovr-e2e-stale-branch-"));
  const git = (...args: string[]): string =>
    execFileSync("git", args, { cwd: repo, encoding: "utf-8" }).trim();
  const commit = async (message: string): Promise<string> => {
    await writeFile(path.join(repo, "CHANGES.md"), message);
    git("add", "-A");
    git("commit", "-q", "-m", message);
    return git("rev-parse", "HEAD");
  };

  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "e2e@ovr.test");
    git("config", "user.name", "E2E");
    git("config", "commit.gpgsign", "false");
    const restyled = await restyleStorybook(repo);

    const mergeBase = await commit("main before the restyle");
    const cut = await ingestStorybook({ apiKey, branch: "main", commitSha: mergeBase, cwd: repo });
    expect(cut.exitCode, cut.stderr).toBe(0);

    const restyle = await commit("restyle every snapshot on main");
    const mainAfter = await ingestStorybook({
      apiKey,
      branch: "main",
      commitSha: restyle,
      cwd: repo,
      storybookDir: restyled,
    });
    expect(mainAfter.exitCode, mainAfter.stderr).toBe(0);

    git("checkout", "-q", "-b", "feature/behind-main", mergeBase);
    const branchHead = await commit("a branch cut before the restyle");
    const branch = await ingestStorybook({
      apiKey,
      branch: "feature/behind-main",
      commitSha: branchHead,
      cwd: repo,
    });

    expect(branch.exitCode, branch.stdout + branch.stderr).toBe(0);
    expect(branch.stdout).toContain("Build passed.");

    const { builds } = await seedClient.builds.list({ projectIds: [projectId] });
    const branchBuildId = builds.find((build) => build.commitSha === branchHead)?.id;
    const mergeBaseBuildId = builds.find((build) => build.commitSha === mergeBase)?.id;
    expect(branchBuildId).toBeDefined();

    await buildPage.goto(projectId, branchBuildId!);
    await expect(buildPage.status()).toHaveText("unchanged");
    await expect(buildPage.baseBuildLink("main", mergeBase.slice(0, 7))).toHaveAttribute(
      "href",
      `/projects/${projectId}/builds/${mergeBaseBuildId}`,
    );

    git("checkout", "-q", "-b", "feature/own-change", mergeBase);
    const ownChange = await commit("a branch that restyles every snapshot itself");
    const changedBranch = await ingestStorybook({
      apiKey,
      branch: "feature/own-change",
      commitSha: ownChange,
      cwd: repo,
      storybookDir: restyled,
    });

    expect(changedBranch.exitCode).not.toBe(0);
    expect(changedBranch.stderr + changedBranch.stdout).toMatch(/needs review/i);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
