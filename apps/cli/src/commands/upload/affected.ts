import path from "node:path";

import { findAffectedStories } from "@ovr/storybook-compat/affectedStories";
import type { StoryTarget } from "@ovr/storybook-compat/manifest";

import type { OvrClient } from "../../client";
import type { OnlyAffectedConfig } from "../../defineConfig";
import { getRepoRoot, isShallowRepository, listAncestorCommits, listChangedFiles } from "../../git";

// How far back to look for a main-branch build to compare against.
const MAX_ANCESTORS = 1000;
const MAX_LISTED_STORY_FILES = 20;

type FindUnaffectedTargetsInput = {
  client: Pick<OvrClient, "builds">;
  storybookDir: string;
  cwd: string;
  targets: StoryTarget[];
  config?: OnlyAffectedConfig;
  log?: (message: string) => void;
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message.split("\n")[0]! : String(error);

// Config globs are written relative to where `ovr` runs; the tracer matches repository paths.
const toRepoGlobs = (globs: string[] | undefined, repoRoot: string, cwd: string): string[] => {
  const prefix = path.relative(repoRoot, cwd).split(path.sep).join("/");
  return (globs ?? []).map((glob) => (prefix ? path.posix.join(prefix, glob) : glob));
};

/**
 * Ids of the stories that nothing changed since the last successful main-branch build can affect.
 * Anything that stops it from telling returns none, so every story is captured.
 */
export const findUnaffectedTargets = async ({
  client,
  storybookDir,
  cwd,
  targets,
  config,
  log = console.log,
}: FindUnaffectedTargetsInput): Promise<string[]> => {
  const captureAll = (reason: string): string[] => {
    log(`Capturing every story: ${reason}.`);
    return [];
  };

  let repoRoot: string;
  let commits: string[];
  try {
    repoRoot = await getRepoRoot(cwd);
    if (await isShallowRepository(cwd)) {
      log(
        "Warning: this is a shallow clone, so the last main-branch build may be out of reach. Fetch the full history (e.g. actions/checkout with fetch-depth: 0).",
      );
    }
    commits = await listAncestorCommits(cwd, "HEAD", MAX_ANCESTORS);
  } catch (error) {
    return captureAll(`could not read the git history (${describeError(error)})`);
  }

  let base: { id: string; commitSha: string } | null;
  try {
    ({ build: base } = await client.builds.findAncestorBuild({ commitShas: commits }));
  } catch (error) {
    return captureAll(
      `the server could not find a build to compare against (${describeError(error)})`,
    );
  }

  if (!base) {
    return captureAll("no successful main-branch build was found in this commit's history");
  }

  let changedFiles: string[];
  try {
    changedFiles = await listChangedFiles(cwd, base.commitSha);
  } catch (error) {
    return captureAll(
      `could not list the files changed since ${base.commitSha} (${describeError(error)})`,
    );
  }

  const result = await findAffectedStories({
    storybookDir,
    repoRoot,
    projectDir: cwd,
    changedFiles,
    externals: toRepoGlobs(config?.externals, repoRoot, cwd),
    untraced: toRepoGlobs(config?.untraced, repoRoot, cwd),
  });

  if (result.mode === "all") {
    return captureAll(result.reason);
  }

  const affected = new Set(result.storyIds);
  const unaffected = targets
    .filter((target) => !affected.has(target.id))
    .map((target) => target.id);

  log(
    `${targets.length - unaffected.length} of ${targets.length} stories are affected by ${changedFiles.length} changed file(s) since ${base.commitSha.slice(0, 7)}.`,
  );
  for (const storyFile of result.storyFiles.slice(0, MAX_LISTED_STORY_FILES)) {
    log(`  ${storyFile.file} (via ${storyFile.via[0]})`);
  }
  if (result.storyFiles.length > MAX_LISTED_STORY_FILES) {
    log(`  …and ${result.storyFiles.length - MAX_LISTED_STORY_FILES} more story files`);
  }

  return unaffected;
};
