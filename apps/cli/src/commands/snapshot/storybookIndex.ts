import { readFile } from "node:fs/promises";
import path from "node:path";

type StorybookIndex = {
  entries?: Record<string, { id: string; type?: string }>;
};

export const readStoryIds = async (dir: string): Promise<string[]> => {
  const indexPath = path.join(dir, "index.json");

  let raw: string;
  try {
    raw = await readFile(indexPath, "utf-8");
  } catch {
    throw new Error(
      `Could not find "index.json" in "${dir}". --dir must point to a Storybook v7+ static build output (run "storybook build" first).`,
    );
  }

  const index = JSON.parse(raw) as StorybookIndex;

  if (!index.entries) {
    throw new Error(
      `"${indexPath}" does not look like a Storybook v7+ index file (missing "entries").`,
    );
  }

  return Object.values(index.entries)
    .filter((entry) => entry.type !== "docs")
    .map((entry) => entry.id);
};
