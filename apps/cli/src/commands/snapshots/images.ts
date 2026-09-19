import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import ky from "ky";

import type { SnapshotImageUrlsSchema } from "@ovr/api/contracts/snapshots";

export type SnapshotImageName = keyof SnapshotImageUrlsSchema;

export type DownloadedImages = Record<SnapshotImageName, string | null>;

const IMAGE_NAMES: SnapshotImageName[] = ["current", "baseline", "diff"];

const fetchImage = async (url: string): Promise<Uint8Array> =>
  new Uint8Array(await ky.get(url, { retry: { limit: 3 } }).arrayBuffer());

export type DownloadSnapshotImagesOptions = {
  urls: SnapshotImageUrlsSchema;
  outDir: string;
  download?: (url: string) => Promise<Uint8Array>;
};

export const downloadSnapshotImages = async ({
  urls,
  outDir,
  download = fetchImage,
}: DownloadSnapshotImagesOptions): Promise<DownloadedImages> => {
  await mkdir(outDir, { recursive: true });

  const entries = await Promise.all(
    IMAGE_NAMES.map(async (name) => {
      const url = urls[name];

      if (!url) {
        return [name, null] as const;
      }

      const filePath = path.join(outDir, `${name}.png`);

      await writeFile(filePath, await download(url));

      return [name, filePath] as const;
    }),
  );

  return Object.fromEntries(entries) as DownloadedImages;
};

export const formatDownloadOutput = (
  downloaded: DownloadedImages,
  json: boolean | undefined,
): string => {
  if (json) {
    return JSON.stringify(downloaded, null, 2);
  }

  const written = IMAGE_NAMES.filter((name) => downloaded[name]);

  if (written.length === 0) {
    return "No images to download for this snapshot.";
  }

  const missing = IMAGE_NAMES.filter((name) => !downloaded[name]);

  return [
    ...written.map((name) => `Wrote ${downloaded[name]}`),
    ...(missing.length > 0 ? [`No ${missing.join(" or ")} image for this snapshot.`] : []),
  ].join("\n");
};
