import { readFile } from "node:fs/promises";
import path from "node:path";

// The oldest Storybook we capture correctly. 8.5 is where the preview started
// emitting `storyFinished`, which is how the capture strategy knows a story's
// play function is done. On 8.4 and older every story sits there until the
// render timeout instead, so those builds are rejected at ingest rather than
// spending a capture job per story to discover it.
export const MINIMUM_STORYBOOK_VERSION = "8.5.0";

// The `v` field in index.json is the manifest format version, not the Storybook
// version: Storybook 7 writes 4, and every Storybook 8, 9 and 10 writes 5. It
// only tells us "at least 8", so it is the fallback for builds without a
// project.json.
const MINIMUM_INDEX_VERSION = 5;

export type StorybookBuildVersion = {
  // The exact version from project.json, when the build has one.
  version?: string;
  // The index.json manifest format version.
  indexVersion?: number;
};

export class UnsupportedStorybookVersionError extends Error {
  constructor(
    message: string,
    readonly detected: StorybookBuildVersion,
  ) {
    super(message);
    this.name = "UnsupportedStorybookVersionError";
  }
}

const readJsonFile = async (filePath: string): Promise<unknown> => {
  try {
    return JSON.parse(await readFile(filePath, "utf-8")) as unknown;
  } catch {
    return undefined;
  }
};

// Compares dotted release numbers, ignoring any prerelease suffix: a
// `9.0.0-alpha.1` build is treated as 9.0.0 so that people testing a Storybook
// prerelease aren't turned away.
const compareVersions = (left: string, right: string): number => {
  const parse = (version: string): number[] =>
    (version.split("-")[0] ?? "").split(".").map((part) => Number.parseInt(part, 10) || 0);

  const leftParts = parse(left);
  const rightParts = parse(right);

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};

export const isSupportedStorybookVersion = (version: string): boolean =>
  compareVersions(version, MINIMUM_STORYBOOK_VERSION) >= 0;

// Reads whatever version information a static build carries. `storybook build`
// writes project.json alongside index.json unless the project disables it, so
// treat both as optional.
export const readStorybookBuildVersion = async (dir: string): Promise<StorybookBuildVersion> => {
  const project = (await readJsonFile(path.join(dir, "project.json"))) as
    | { storybookVersion?: unknown }
    | undefined;
  const index = (await readJsonFile(path.join(dir, "index.json"))) as { v?: unknown } | undefined;

  return {
    version: typeof project?.storybookVersion === "string" ? project.storybookVersion : undefined,
    indexVersion: typeof index?.v === "number" ? index.v : undefined,
  };
};

// Throws when the build is definitely from a Storybook we don't support. A
// build we can't place — no project.json and no recognisable manifest version —
// is allowed through: the manifest parser gives a better error for those.
export const assertSupportedStorybookBuild = async (
  dir: string,
): Promise<StorybookBuildVersion> => {
  const detected = await readStorybookBuildVersion(dir);

  if (detected.version !== undefined && !isSupportedStorybookVersion(detected.version)) {
    throw new UnsupportedStorybookVersionError(
      `"${dir}" was built with Storybook ${detected.version}, but Open Visual Regression requires Storybook ${MINIMUM_STORYBOOK_VERSION} or newer. Upgrade Storybook and rebuild.`,
      detected,
    );
  }

  if (
    detected.version === undefined &&
    detected.indexVersion !== undefined &&
    detected.indexVersion < MINIMUM_INDEX_VERSION
  ) {
    throw new UnsupportedStorybookVersionError(
      `"${dir}" looks like a Storybook 7 build (index.json v${detected.indexVersion}), but Open Visual Regression requires Storybook ${MINIMUM_STORYBOOK_VERSION} or newer. Upgrade Storybook and rebuild.`,
      detected,
    );
  }

  return detected;
};
