import { readFile } from "node:fs/promises";
import path from "node:path";

export const MINIMUM_STORYBOOK_VERSION = "8.5.0";

const MINIMUM_INDEX_VERSION = 5;

export type StorybookBuildVersion = {
  version?: string;
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
