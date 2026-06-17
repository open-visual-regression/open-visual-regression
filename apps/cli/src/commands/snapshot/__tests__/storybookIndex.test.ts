import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readStoryIds } from "../storybookIndex";

const writeIndex = async (entries: object): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-index-"));
  await writeFile(path.join(dir, "index.json"), JSON.stringify({ v: 5, entries }));
  return dir;
};

describe("readStoryIds", () => {
  it("returns only the story ids, leaving out docs pages so they're never captured", async () => {
    const dir = await writeIndex({
      "button--docs": { id: "button--docs", type: "docs" },
      "button--default": { id: "button--default", type: "story" },
    });

    try {
      expect(await readStoryIds(dir)).toEqual(["button--default"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when index.json is missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-index-"));

    try {
      await expect(readStoryIds(dir)).rejects.toThrow(/Could not find "index.json"/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when index.json has no entries", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-index-"));
    await writeFile(path.join(dir, "index.json"), JSON.stringify({ v: 5 }));

    try {
      await expect(readStoryIds(dir)).rejects.toThrow(/missing "entries"/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
