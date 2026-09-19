import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { downloadSnapshotImages, formatDownloadOutput, type DownloadedImages } from "../images";

const ALL_URLS = {
  current: "https://storage.example/current.png?signed",
  baseline: "https://storage.example/baseline.png?signed",
  diff: "https://storage.example/diff.png?signed",
};

const fakeDownload = (bytesByUrl: Record<string, number[]>) => {
  const download = async (url: string): Promise<Uint8Array> => {
    const bytes = bytesByUrl[url];

    if (!bytes) {
      throw new Error(`Unexpected download of ${url}`);
    }

    return new Uint8Array(bytes);
  };

  return download;
};

describe("downloadSnapshotImages", () => {
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), "ovr-download-test-"));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it("should write each image's own bytes to its own file", async () => {
    const download = fakeDownload({
      [ALL_URLS.current]: [1],
      [ALL_URLS.baseline]: [2],
      [ALL_URLS.diff]: [3],
    });

    const downloaded = await downloadSnapshotImages({ urls: ALL_URLS, outDir, download });

    expect(downloaded).toEqual({
      current: path.join(outDir, "current.png"),
      baseline: path.join(outDir, "baseline.png"),
      diff: path.join(outDir, "diff.png"),
    });
    expect(await readFile(downloaded.current!)).toEqual(Buffer.from([1]));
    expect(await readFile(downloaded.baseline!)).toEqual(Buffer.from([2]));
    expect(await readFile(downloaded.diff!)).toEqual(Buffer.from([3]));
  });

  it("should skip an image with no url instead of writing an empty file", async () => {
    const download = fakeDownload({ [ALL_URLS.current]: [1] });

    const downloaded = await downloadSnapshotImages({
      urls: { current: ALL_URLS.current, baseline: null, diff: null },
      outDir,
      download,
    });

    expect(downloaded).toEqual({
      current: path.join(outDir, "current.png"),
      baseline: null,
      diff: null,
    });
    await expect(access(path.join(outDir, "baseline.png"))).rejects.toThrow("ENOENT");
    await expect(access(path.join(outDir, "diff.png"))).rejects.toThrow("ENOENT");
  });

  it("should create the output directory when it does not exist", async () => {
    const download = fakeDownload({ [ALL_URLS.current]: [1] });
    const nested = path.join(outDir, "nested", "deeper");

    const downloaded = await downloadSnapshotImages({
      urls: { current: ALL_URLS.current, baseline: null, diff: null },
      outDir: nested,
      download,
    });

    expect(await readFile(downloaded.current!)).toEqual(Buffer.from([1]));
  });
});

describe("formatDownloadOutput", () => {
  const WRITTEN: DownloadedImages = {
    current: "/out/current.png",
    baseline: "/out/baseline.png",
    diff: "/out/diff.png",
  };

  it("should print the written paths as JSON when json is true", () => {
    expect(formatDownloadOutput(WRITTEN, true)).toBe(JSON.stringify(WRITTEN, null, 2));
  });

  it("should print a line per written image", () => {
    expect(formatDownloadOutput(WRITTEN, false)).toBe(
      "Wrote /out/current.png\nWrote /out/baseline.png\nWrote /out/diff.png",
    );
  });

  it("should name the images the snapshot did not have", () => {
    expect(
      formatDownloadOutput({ current: "/out/current.png", baseline: null, diff: null }, false),
    ).toBe("Wrote /out/current.png\nNo baseline or diff image for this snapshot.");
  });

  it("should report when the snapshot had no images at all", () => {
    expect(formatDownloadOutput({ current: null, baseline: null, diff: null }, false)).toBe(
      "No images to download for this snapshot.",
    );
  });
});
