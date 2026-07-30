import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  logging: { browserToTerminal: true },
  async redirects() {
    return [{ source: "/", destination: "/projects", permanent: false }];
  },
};

export default nextConfig;
