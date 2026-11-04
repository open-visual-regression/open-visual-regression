import path from "node:path";

import { findAffectedStories } from "@ovr/storybook-compat/affectedStories";
import type { StoryTarget } from "@ovr/storybook-compat/manifest";

import type { OnlyAffectedConfig } from "../../defineConfig";
import { getRepoRoot, listChangedFiles, readFileAtCommit } from "../../git";
import type { BaseBuildLookup } from "./baseBuild";

const MAX_LISTED_STORY_FILES = 20;
const MAX_LISTED_PACKAGES = 10;

type FindUnaffectedTargetsInput = {
  base: BaseBuildLookup;
  storybookDir: string;
  cwd: string;
  targets: StoryTarget[];
  config?: OnlyAffectedConfig;
  log?: (message: string) => void;
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message.split("\n")[0]! : String(error);

const toRepoGlobs = (globs: string[] | undefined, repoRoot: string, cwd: string): string[] => {
  const prefix = path.relative(repoRoot, cwd).split(path.sep).join("/");
  return (globs ?? []).map((glob) => (prefix ? path.posix.join(prefix, glob) : glob));
};

export const findUnaffectedTargets = async ({
  base,
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

  if (base.status === "missing") {
    return captureAll(base.reason);
  }

  const baseCommit = base.build.commitSha;

  let repoRoot: string;
  try {
    repoRoot = await getRepoRoot(cwd);
  } catch (error) {
    return captureAll(`could not read the git history (${describeError(error)})`);
  }

  let changedFiles: string[];
  try {
    changedFiles = await listChangedFiles(cwd, baseCommit);
  } catch (error) {
    return captureAll(
      `could not list the files changed since ${baseCommit} (${describeError(error)})`,
    );
  }

  const result = await findAffectedStories({
    storybookDir,
    repoRoot,
    projectDir: cwd,
    changedFiles,
    externals: toRepoGlobs(config?.externals, repoRoot, cwd),
    untraced: toRepoGlobs(config?.untraced, repoRoot, cwd),
    readBaseFile: (file) => readFileAtCommit(cwd, baseCommit, file),
  });

  if (result.mode === "all") {
    return captureAll(result.reason);
  }

  const affected = new Set(result.storyIds);
  const unaffected = targets
    .filter((target) => !affected.has(target.id))
    .map((target) => target.id);

  log(
    `${targets.length - unaffected.length} of ${targets.length} stories are affected by ${changedFiles.length} changed file(s) since ${baseCommit.slice(0, 7)}.`,
  );
  for (const { lockfile, packages } of result.unbundledDependencies) {
    const listed = packages.slice(0, MAX_LISTED_PACKAGES).join(", ");
    const more = packages.length - MAX_LISTED_PACKAGES;
    log(
      packages.length === 0
        ? `  ${lockfile} changed, but no package entries in it did.`
        : `  ${lockfile} changed only packages the Storybook does not bundle: ${listed}${more > 0 ? ` and ${more} more` : ""}.`,
    );
  }
  for (const storyFile of result.storyFiles.slice(0, MAX_LISTED_STORY_FILES)) {
    log(`  ${storyFile.file} (via ${storyFile.via[0]})`);
  }
  if (result.storyFiles.length > MAX_LISTED_STORY_FILES) {
    log(`  …and ${result.storyFiles.length - MAX_LISTED_STORY_FILES} more story files`);
  }

  return unaffected;
};
