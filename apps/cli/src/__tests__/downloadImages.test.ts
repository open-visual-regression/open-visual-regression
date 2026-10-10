import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach } from "vitest";

import type { OvrClient } from "../client";
import { downloadImages } from "../download";
import { describe, expect, test, vi } from "./fixtures";

type GetObject = OvrClient["storage"]["getObject"];

let dir: string;

const clientFor = (url: string) => ({
  storage: {
    getObject: vi.fn<GetObject>().mockImplementation(async ({ path: imagePath }) => ({
      status: 302,
      headers: { location: `${url}/${imagePath}`, "cache-control": "private" },
    })),
  },
});

beforeEach(async () => {
  dir = path.join(await mkdtemp(path.join(tmpdir(), "ovr-cli-download-")), "images");
});

afterEach(async () => {
  await rm(path.dirname(dir), { recursive: true, force: true });
});

describe("downloadImages", () => {
  test("should save each image under its name in a newly created directory", async ({
    storageServer,
  }) => {
    const files = await downloadImages(clientFor(storageServer.url), dir, [
      { name: "baseline", imagePath: "project/baseline.png" },
      { name: "diff", imagePath: "project/diff.png" },
    ]);

    expect(files).toEqual([path.join(dir, "baseline.png"), path.join(dir, "diff.png")]);
    expect(await readFile(path.join(dir, "baseline.png"), "utf8")).toBe("baseline image");
    expect(await readFile(path.join(dir, "diff.png"), "utf8")).toBe("diff image");
  });

  test("should skip targets without an image path", async ({ storageServer }) => {
    const client = clientFor(storageServer.url);

    const files = await downloadImages(client, dir, [
      { name: "baseline", imagePath: null },
      { name: "new", imagePath: "project/new.png" },
    ]);

    expect(files).toEqual([path.join(dir, "new.png")]);
    expect(await readdir(dir)).toEqual(["new.png"]);
    expect(client.storage.getObject).toHaveBeenCalledTimes(1);
  });
});
