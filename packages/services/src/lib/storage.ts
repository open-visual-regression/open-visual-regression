import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { storage } from "@ovr/storage";

const contentTypes: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".wasm": "application/wasm",
  ".txt": "text/plain",
};

const contentTypeFor = (filePath: string): string =>
  contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

const listFiles = async (dir: string, base = dir): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(fullPath, base) : Promise.resolve([fullPath]);
    }),
  );

  return files.flat().map((file) => path.relative(base, file));
};

export const uploadDirectory = async (localDir: string, remotePrefix: string): Promise<void> => {
  const files = await listFiles(localDir);

  await Promise.all(
    files.map(async (relativePath) => {
      const content = await readFile(path.join(localDir, relativePath));
      const key = `${remotePrefix}/${relativePath.split(path.sep).join("/")}`;
      await storage.uploadFile(key, content, contentTypeFor(relativePath));
    }),
  );
};
