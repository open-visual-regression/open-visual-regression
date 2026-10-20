import path from "node:path";

import { findAffectedStories } from "@ovr/storybook-compat/affectedStories";
import type { StoryTarget } from "@ovr/storybook-compat/manifest";

import type { OvrClient } from "../../client";
import { evalOvrConfig, resolveViewports } from "../../config";
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
// The server's limit on the reason recorded on the build.
const MAX_RECORDED_REASON_LENGTH = 2000;

type FindUnaffectedTargetsInput = {
  client: Pick<OvrClient, "builds">;
  storybookDir: string;
  cwd: string;
  targets: StoryTarget[];
  config?: OnlyAffectedConfig;
  /** The ovr.config this upload was configured with, to compare against the base commit's. */
  ovrConfig?: { file: string; config: OvrConfig | undefined };
  log?: (message: string) => void;
};

/** What `--only-affected` decided, recorded on the build so the UI can show it. */
export type OnlyAffectedSummary = {
  baseBuildId: string | null;
  baseCommitSha: string | null;
  /** Why every story was captured, or null if only the affected ones were. */
  captureAllReason: string | null;
};

export type UnaffectedTargets = {
  unaffectedTargetIds: string[];
  summary: OnlyAffectedSummary;
};

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message.split("\n")[0]! : String(error);

const toRepoGlobs = (globs: string[] | undefined, repoRoot: string, cwd: string): string[] => {
  const prefix = path.relative(repoRoot, cwd).split(path.sep).join("/");
  return (globs ?? []).map((glob) => (prefix ? path.posix.join(prefix, glob) : glob));
};

// Config keys that cannot change how a story renders. Viewports are left to the server, which
// only keeps a baseline for an unaffected story at a browser and size it was captured at.
const NON_RENDERING_CONFIG_KEYS = new Set(["serverUrl", "onlyAffected", "diffThreshold"]);

const describeConfigChange = (
  file: string,
  base: OvrConfig,
  head: OvrConfig,
): { captureAllReason?: string; notes: string[] } => {
  const changed = (key: string) =>
    JSON.stringify(base[key as keyof OvrConfig]) !== JSON.stringify(head[key as keyof OvrConfig]);
  const keys = [...new Set([...Object.keys(base), ...Object.keys(head)])].filter(changed);

  const notes = keys.includes("diffThreshold")
    ? [`${file} changed "diffThreshold"; it applies to the stories captured in this build`]
    : [];
  if (JSON.stringify(resolveViewports(base)) !== JSON.stringify(resolveViewports(head))) {
    notes.push(
      `${file} changed the viewports; stories are captured at any viewport they have no baseline for`,
    );
  }

  const rendering = keys.filter(
    (key) =>
      !NON_RENDERING_CONFIG_KEYS.has(key) && key !== "viewports" && key !== "defaultViewports",
  );
  return rendering.length > 0
    ? {
        captureAllReason: `${file} changed ${rendering.map((key) => `"${key}"`).join(", ")}, which can change how every story renders`,
        notes,
      }
    : { notes };
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
  let base: { id: string; commitSha: string } | null = null;

  const captureAll = (reason: string): UnaffectedTargets => {
    log(`Capturing every story: ${reason}.`);
    return {
      unaffectedTargetIds: [],
      summary: {
        baseBuildId: base?.id ?? null,
        baseCommitSha: base?.commitSha ?? null,
        captureAllReason: reason.slice(0, MAX_RECORDED_REASON_LENGTH),
      },
    };
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
    base = null;
    return captureAll("the server returned a build that is not in this commit's history");
  }

  const { id: baseBuildId, commitSha: baseCommitSha } = base;
  log(`Comparing against main-branch build ${baseBuildId} at ${baseCommitSha}.`);

  let changedFiles: string[];
  try {
    changedFiles = await listChangedFiles(cwd, base.commitSha);
  } catch (error) {
    return captureAll(
      `could not list the files changed since ${base.commitSha} (${describeError(error)})`,
    );
  }

  const readBaseFile = (file: string) => readFileAtCommit(repoRoot, baseCommitSha, file);
  const untraced = toRepoGlobs(config?.untraced, repoRoot, cwd);

  if (ovrConfig) {
    const configFile = path.relative(repoRoot, ovrConfig.file).split(path.sep).join("/");
    if (changedFiles.includes(configFile)) {
      let change: ReturnType<typeof describeConfigChange>;
      try {
        const source = await readBaseFile(configFile);
        const baseConfig =
          source === undefined ? undefined : await evalOvrConfig(source, ovrConfig.file);
        change = describeConfigChange(configFile, baseConfig ?? {}, ovrConfig.config ?? {});
      } catch (error) {
        return captureAll(
          `could not load ${configFile} as of ${baseCommitSha.slice(0, 7)} to compare it (${describeError(error)})`,
        );
      }

      for (const note of change.notes) {
        log(`${note}.`);
      }
      if (change.captureAllReason) {
        return captureAll(change.captureAllReason);
      }
      // Checked above, so it is not traced as build configuration, even under a custom name.
      untraced.push(configFile);
    }
  }

  const result = await findAffectedStories({
    storybookDir,
    repoRoot,
    projectDir: cwd,
    changedFiles,
    externals: toRepoGlobs(config?.externals, repoRoot, cwd),
    untraced,
    readBaseFile,
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

  return {
    unaffectedTargetIds: unaffected,
    summary: { baseBuildId, baseCommitSha, captureAllReason: null },
  };
};
