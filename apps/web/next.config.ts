import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  logging: { browserToTerminal: true },
  experimental: {
    // Avoids an endless prefetch loop: https://github.com/vercel/next.js/issues/97135
    optimisticRouting: false,
  },
  async redirects() {
    return [{ source: "/", destination: "/projects", permanent: false }];
  },
};

export default nextConfig;
