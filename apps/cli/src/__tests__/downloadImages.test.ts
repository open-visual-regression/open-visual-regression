import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OvrClient } from "../client";
import { downloadImages } from "../download";

let server: ReturnType<typeof createServer>;
let origin: string;
let dir: string;

const IMAGES = new Map([
  ["/project/baseline.png", "baseline image"],
  ["/project/diff.png", "diff image"],
  ["/project/new.png", "new image"],
]);

const createStorageClient = () => ({
  storage: {
    getObject: vi.fn<OvrClient["storage"]["getObject"]>(async ({ path: imagePath }) => ({
      status: 302 as const,
      headers: { location: `${origin}/${imagePath}`, "cache-control": "private" },
    })),
  },
});

beforeEach(async () => {
  server = createServer((request, response) => {
    const image = IMAGES.get(request.url ?? "");
    response.writeHead(image ? 200 : 404, { "content-type": "image/png" }).end(image);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  dir = path.join(await mkdtemp(path.join(tmpdir(), "ovr-download-")), "images");
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(path.dirname(dir), { recursive: true, force: true });
});

describe("downloadImages", () => {
  it("should save each image under its name in a newly created directory", async () => {
    const client = createStorageClient();

    const files = await downloadImages(client, dir, [
      { name: "baseline", imagePath: "project/baseline.png" },
      { name: "diff", imagePath: "project/diff.png" },
    ]);

    expect(files).toEqual([path.join(dir, "baseline.png"), path.join(dir, "diff.png")]);
    expect(await readFile(path.join(dir, "baseline.png"), "utf8")).toBe("baseline image");
    expect(await readFile(path.join(dir, "diff.png"), "utf8")).toBe("diff image");
  });

  it("should skip targets without an image path", async () => {
    const client = createStorageClient();

    const files = await downloadImages(client, dir, [
      { name: "baseline", imagePath: null },
      { name: "new", imagePath: "project/new.png" },
    ]);

    expect(files).toEqual([path.join(dir, "new.png")]);
    expect(await readdir(dir)).toEqual(["new.png"]);
    expect(client.storage.getObject).toHaveBeenCalledTimes(1);
  });
});
