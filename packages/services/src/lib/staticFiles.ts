import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain",
};

export const getContentType = (filePath: string): string =>
  CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

export const getStaticPath = (projectId: string, buildId: string, relativePath: string): string =>
  `${projectId}/builds/${buildId}/static/${relativePath}`;
