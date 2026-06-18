import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readStoryTargets } from "../storybookManifest";

const writeManifest = async (entries: object): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-manifest-"));
  await writeFile(path.join(dir, "index.json"), JSON.stringify({ v: 5, entries }));
  return dir;
};

describe("readStoryTargets", () => {
  it("returns only the story targets, leaving out docs pages so they're never captured", async () => {
    const dir = await writeManifest({
      "button--docs": { id: "button--docs", title: "Button", name: "Docs", type: "docs" },
      "button--default": { id: "button--default", title: "Button", name: "Default", type: "story" },
    });

    try {
      expect(await readStoryTargets(dir)).toEqual([
        { id: "button--default", title: "Button", name: "Default" },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when index.json is missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-manifest-"));

    try {
      await expect(readStoryTargets(dir)).rejects.toThrow(/Could not find "index.json"/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when index.json has no entries", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-storybook-manifest-"));
    await writeFile(path.join(dir, "index.json"), JSON.stringify({ v: 5 }));

    try {
      await expect(readStoryTargets(dir)).rejects.toThrow(/missing "entries"/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
