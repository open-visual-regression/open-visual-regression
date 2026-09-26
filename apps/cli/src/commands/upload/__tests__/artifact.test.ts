import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import * as tar from "tar";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createArtifactTarball } from "../artifact";

let dir: string;

const listEntries = async (artifact: Buffer): Promise<string[]> => {
  const entries: string[] = [];
  await pipeline(
    Readable.from(artifact),
    tar.list({ onReadEntry: (entry) => entries.push(path.posix.normalize(entry.path)) }),
  );
  return entries;
};

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-artifact-"));
  await mkdir(path.join(dir, "assets"));
  await writeFile(path.join(dir, "index.json"), "{}");
  await writeFile(path.join(dir, "preview-stats.json"), "{}");
  await writeFile(path.join(dir, "assets", "preview-stats.json"), "{}");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("createArtifactTarball", () => {
  it("packs every file in the directory", async () => {
    const entries = await listEntries(await createArtifactTarball(dir));

    expect(entries).toEqual(
      expect.arrayContaining(["index.json", "preview-stats.json", "assets/preview-stats.json"]),
    );
  });

  it("leaves out excluded top-level files", async () => {
    const entries = await listEntries(await createArtifactTarball(dir, ["preview-stats.json"]));

    expect(entries).toContain("index.json");
    expect(entries).toContain("assets/preview-stats.json");
    expect(entries).not.toContain("preview-stats.json");
  });
});
