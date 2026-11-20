import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";

import { getContentType } from "./staticFiles";

// A proxy serves one bundle that never changes while it runs, so the browser can keep every file
// instead of downloading and parsing the bundle again each time the page reloads.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

export type StaticProxy = { origin: string; close: () => void };

export const startStaticProxy = (rootDir: string): Promise<StaticProxy> =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const requestedPath = decodeURIComponent((req.url ?? "/").split("?")[0]!).replace(/^\/+/, "");
      const relativePath = path.posix.normalize(requestedPath);

      if (relativePath === ".." || relativePath.startsWith("../")) {
        res.writeHead(403);
        res.end();
        return;
      }

      const absolutePath = path.join(rootDir, relativePath);

      if (!existsSync(absolutePath)) {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200, {
        "Content-Type": getContentType(relativePath),
        "Cache-Control": CACHE_CONTROL,
      });
      const stream = createReadStream(absolutePath);
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("Expected the static proxy server to bind to a TCP port");
      }
      resolve({
        origin: `http://localhost:${address.port}`,
        close: () => server.close(),
      });
    });
  });
