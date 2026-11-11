import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  logging: { browserToTerminal: true },
  async headers() {
    return [{ source: "/:path*{/}?", headers: [{ key: "X-Accel-Buffering", value: "no" }] }];
  },
};

export default nextConfig;
