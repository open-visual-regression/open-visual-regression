import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadSnapshotImages, formatDownloadOutput, type DownloadedImages } from "../images";

const ALL_URLS = {
  current: "https://storage.example/current.png?signed",
  baseline: "https://storage.example/baseline.png?signed",
  diff: "https://storage.example/diff.png?signed",
};

describe("downloadSnapshotImages", () => {
  let outDir: string;

  beforeEach(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), "ovr-download-test-"));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  it("should write every image it was given a url for", async () => {
    const download = vi
      .fn<(url: string) => Promise<Uint8Array>>()
      .mockResolvedValue(new Uint8Array([1, 2, 3]));

    const downloaded = await downloadSnapshotImages({ urls: ALL_URLS, outDir, download });

    expect(downloaded).toEqual({
      current: path.join(outDir, "current.png"),
      baseline: path.join(outDir, "baseline.png"),
      diff: path.join(outDir, "diff.png"),
    });
    expect(await readFile(path.join(outDir, "current.png"))).toEqual(Buffer.from([1, 2, 3]));
  });

  it("should fetch each image from its own presigned url", async () => {
    const download = vi
      .fn<(url: string) => Promise<Uint8Array>>()
      .mockResolvedValue(new Uint8Array([1]));

    await downloadSnapshotImages({ urls: ALL_URLS, outDir, download });

    expect(download).toHaveBeenCalledWith(ALL_URLS.current);
    expect(download).toHaveBeenCalledWith(ALL_URLS.baseline);
    expect(download).toHaveBeenCalledWith(ALL_URLS.diff);
  });

  it("should skip an image with no url instead of writing an empty file", async () => {
    const download = vi
      .fn<(url: string) => Promise<Uint8Array>>()
      .mockResolvedValue(new Uint8Array([1]));

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
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("should create the output directory when it does not exist", async () => {
    const download = vi
      .fn<(url: string) => Promise<Uint8Array>>()
      .mockResolvedValue(new Uint8Array([1]));
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
