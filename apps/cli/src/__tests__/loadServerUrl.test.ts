import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadServerUrl } from "../config";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const writeConfig = (contents: string): Promise<void> =>
  writeFile(path.join(dir, "ovr.config.mjs"), contents);

describe("loadServerUrl", () => {
  it("should throw a clear error when no override and no config file exist", async () => {
    await expect(loadServerUrl(dir)).rejects.toThrow(/no server url/i);
  });

  it("should throw a clear error when the config omits 'serverUrl' and there's no override", async () => {
    await writeConfig(`export default { diffThreshold: 0.2 };`);

    await expect(loadServerUrl(dir)).rejects.toThrow(/no server url/i);
  });

  it("should use the config's 'serverUrl' when there's no override", async () => {
    await writeConfig(`export default { serverUrl: "https://ovr.example.com" };`);

    expect(await loadServerUrl(dir)).toBe("https://ovr.example.com");
  });

  it("should prefer the override over the config's 'serverUrl'", async () => {
    await writeConfig(`export default { serverUrl: "https://ovr.example.com" };`);

    expect(await loadServerUrl(dir, "https://override.example.com")).toBe(
      "https://override.example.com",
    );
  });

  it("should use the override when no config file exists", async () => {
    expect(await loadServerUrl(dir, "https://override.example.com")).toBe(
      "https://override.example.com",
    );
  });
});
