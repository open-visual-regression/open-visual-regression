import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import ky from "ky";

import type { OvrClient } from "./client";

export type DownloadTarget = {
  name: string;
  imagePath: string | null;
};

type DownloadableTarget = DownloadTarget & { imagePath: string };

type StorageClient = {
  storage: Pick<OvrClient["storage"], "getObject">;
};

export const fetchImage = async (client: StorageClient, imagePath: string): Promise<Uint8Array> => {
  const { headers } = await client.storage.getObject({ path: imagePath });
  const image = await ky.get(headers.location, { retry: { limit: 3 } }).arrayBuffer();

  return new Uint8Array(image);
};

const downloadImage = async (
  client: StorageClient,
  dir: string,
  name: string,
  imagePath: string,
): Promise<string> => {
  const file = path.join(dir, `${name}.png`);

  await writeFile(file, await fetchImage(client, imagePath));

  return file;
};

export const downloadImages = async (
  client: StorageClient,
  dir: string,
  targets: DownloadTarget[],
): Promise<string[]> => {
  await mkdir(dir, { recursive: true });

  return Promise.all(
    targets
      .filter((target): target is DownloadableTarget => target.imagePath !== null)
      .map(({ name, imagePath }) => downloadImage(client, dir, name, imagePath)),
  );
};
