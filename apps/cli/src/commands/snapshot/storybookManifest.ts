import { readFile } from "node:fs/promises";
import path from "node:path";

type StorybookManifest = {
  entries?: Record<string, { id: string; type?: string }>;
};

export const readStoryIds = async (dir: string): Promise<string[]> => {
  const manifestPath = path.join(dir, "index.json");

  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf-8");
  } catch {
    throw new Error(
      `Could not find "index.json" in "${dir}". --dir must point to a Storybook v7+ static build output (run "storybook build" first).`,
    );
  }

  const manifest = JSON.parse(raw) as StorybookManifest;

  if (!manifest.entries) {
    throw new Error(
      `"${manifestPath}" does not look like a Storybook v7+ index file (missing "entries").`,
    );
  }

  return Object.values(manifest.entries)
    .filter((entry) => entry.type !== "docs")
    .map((entry) => entry.id);
};
