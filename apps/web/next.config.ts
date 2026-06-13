import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
  logging: { browserToTerminal: true },
};

export default nextConfig;
