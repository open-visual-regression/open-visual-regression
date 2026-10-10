import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import ky from "ky";

import type { OvrClient } from "./client";

export type DownloadTarget = {
  name: string;
  imagePath: string | null;
};

type StorageClient = { storage: Pick<OvrClient["storage"], "getObject"> };

const downloadImage = async (
  client: StorageClient,
  dir: string,
  name: string,
  imagePath: string,
): Promise<string> => {
  const { headers } = await client.storage.getObject({ path: imagePath });
  const image = await ky.get(headers.location, { retry: { limit: 3 } }).arrayBuffer();
  const file = path.join(dir, `${name}.png`);

  await writeFile(file, new Uint8Array(image));

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
      .filter((target): target is { name: string; imagePath: string } => target.imagePath !== null)
      .map(({ name, imagePath }) => downloadImage(client, dir, name, imagePath)),
  );
};
