import path from "node:path";

import { findAffectedStories } from "@ovr/storybook-compat/affectedStories";
import type { StoryTarget } from "@ovr/storybook-compat/manifest";

import type { OvrClient } from "../../client";
import { loadOvrConfigSource, resolveViewports, resolveWaitForTimeout } from "../../config";
import type { OnlyAffectedConfig, OvrConfig } from "../../defineConfig";
import {
  getRepoRoot,
  isShallowRepository,
  listAncestorCommits,
  listChangedFiles,
  readFileAtCommit,
} from "../../git";

const MAX_ANCESTORS = 1000;
const MAX_LISTED_STORY_FILES = 20;

type FindUnaffectedTargetsInput = {
  client: Pick<OvrClient, "builds">;
  storybookDir: string;
  cwd: string;
  targets: StoryTarget[];
  config?: OnlyAffectedConfig;
  /** The ovr.config this run loaded, so a change to it can be compared with the base commit's. */
  ovrConfig?: { file: string; config: OvrConfig | undefined };
  log?: (message: string) => void;
};

export type UnaffectedTargets = {
  unaffectedTargetIds: string[];
  /** Why every story is captured instead, recorded on the build. */
  captureAllReason?: string;
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message.split("\n")[0]! : String(error);

// Settings that change the screenshots themselves. Anything else in ovr.config can't.
const describeCaptureSettingsChange = (
  base: OvrConfig | undefined,
  current: OvrConfig | undefined,
): string | null => {
  if (JSON.stringify(resolveViewports(base)) !== JSON.stringify(resolveViewports(current))) {
    return "viewports changed";
  }
  if (resolveWaitForTimeout(base) !== resolveWaitForTimeout(current)) {
    return "waitForTimeout changed";
  }
  return null;
};

const toRepoGlobs = (globs: string[] | undefined, repoRoot: string, cwd: string): string[] => {
  const prefix = path.relative(repoRoot, cwd).split(path.sep).join("/");
  return (globs ?? []).map((glob) => (prefix ? path.posix.join(prefix, glob) : glob));
};

export const findUnaffectedTargets = async ({
  client,
  storybookDir,
  cwd,
  targets,
  config,
  ovrConfig,
  log = console.log,
}: FindUnaffectedTargetsInput): Promise<UnaffectedTargets> => {
  const captureAll = (reason: string): UnaffectedTargets => {
    log(`Capturing every story: ${reason}.`);
    return { unaffectedTargetIds: [], captureAllReason: reason };
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

  if (!commits.includes(base.commitSha)) {
    return captureAll("the server returned a build that is not in this commit's history");
  }

  let changedFiles: string[];
  try {
    changedFiles = await listChangedFiles(cwd, base.commitSha);
  } catch (error) {
    return captureAll(
      `could not list the files changed since ${base.commitSha} (${describeError(error)})`,
    );
  }

  const readBaseFile = (file: string) => readFileAtCommit(cwd, base.commitSha, file);
  const toRepoPath = (file: string) => path.relative(repoRoot, file).split(path.sep).join("/");

  let result: Awaited<ReturnType<typeof findAffectedStories>>;
  try {
    result = await findAffectedStories({
      storybookDir,
      repoRoot,
      projectDir: cwd,
      changedFiles,
      externals: toRepoGlobs(config?.externals, repoRoot, cwd),
      untraced: toRepoGlobs(config?.untraced, repoRoot, cwd),
      buildDependencies: config?.buildDependencies,
      readBaseFile,
      ...(ovrConfig && {
        ovrConfig: {
          file: toRepoPath(ovrConfig.file),
          changedCaptureSettings: async () => {
            const source = await readBaseFile(toRepoPath(ovrConfig.file));
            try {
              const baseConfig =
                source === undefined
                  ? undefined
                  : await loadOvrConfigSource(ovrConfig.file, source);
              return describeCaptureSettingsChange(baseConfig, ovrConfig.config);
            } catch (error) {
              return `could not load ovr.config from ${base.commitSha.slice(0, 7)} (${describeError(error)})`;
            }
          },
        },
      }),
    });
  } catch (error) {
    return captureAll(`could not compare with ${base.commitSha} (${describeError(error)})`);
  }

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

  return { unaffectedTargetIds: unaffected };
};
