import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadServerUrl } from "../config";

const writeConfig = async (contents: string): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));
  await writeFile(path.join(dir, "ovr.config.mjs"), contents);
  return dir;
};

describe("loadServerUrl", () => {
  it("should throw a clear error when no override and no config file exist", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      await expect(loadServerUrl(dir)).rejects.toThrow(/no server url/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should throw a clear error when the config omits 'serverUrl' and there's no override", async () => {
    const dir = await writeConfig(`export default { diffThreshold: 0.2 };`);

    try {
      await expect(loadServerUrl(dir)).rejects.toThrow(/no server url/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should use the config's 'serverUrl' when there's no override", async () => {
    const dir = await writeConfig(`export default { serverUrl: "https://ovr.example.com" };`);

    try {
      expect(await loadServerUrl(dir)).toBe("https://ovr.example.com");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should prefer the override over the config's 'serverUrl'", async () => {
    const dir = await writeConfig(`export default { serverUrl: "https://ovr.example.com" };`);

    try {
      expect(await loadServerUrl(dir, "https://override.example.com")).toBe(
        "https://override.example.com",
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should use the override when no config file exists", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      expect(await loadServerUrl(dir, "https://override.example.com")).toBe(
        "https://override.example.com",
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
