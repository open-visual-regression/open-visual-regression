import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  serverExternalPackages: ["pino", "pino-pretty"],
  logging: { browserToTerminal: true },
};

export default nextConfig;
