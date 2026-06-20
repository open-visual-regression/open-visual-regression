import { type OvrConfig } from "@ovr/cli/config";

export default {
  viewports: [
    { name: "desktop", width: 1280 },
    { name: "mobile", width: 375 },
  ],
  defaultViewports: ["desktop"],
} as const satisfies OvrConfig;
