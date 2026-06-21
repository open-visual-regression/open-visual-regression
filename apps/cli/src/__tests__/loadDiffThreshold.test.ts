import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_DIFF_THRESHOLD, loadDiffThreshold } from "../config";

const writeConfig = async (contents: string): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));
  await writeFile(path.join(dir, "ovr.config.mjs"), contents);
  return dir;
};

describe("loadDiffThreshold", () => {
  it("should use the default diff threshold when no config file exists", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      expect(await loadDiffThreshold(dir)).toBe(DEFAULT_DIFF_THRESHOLD);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should use the default diff threshold when the config omits 'diffThreshold'", async () => {
    const dir = await writeConfig(`export default { viewports: [{ width: 1280 }] };`);

    try {
      expect(await loadDiffThreshold(dir)).toBe(DEFAULT_DIFF_THRESHOLD);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should use the config's 'diffThreshold' when set", async () => {
    const dir = await writeConfig(`export default { diffThreshold: 0.2 };`);

    try {
      expect(await loadDiffThreshold(dir)).toBe(0.2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("should throw a clear error when 'diffThreshold' is out of range", async () => {
    const dir = await writeConfig(`export default { diffThreshold: 1.5 };`);

    try {
      await expect(loadDiffThreshold(dir)).rejects.toThrow(/diffThreshold/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
