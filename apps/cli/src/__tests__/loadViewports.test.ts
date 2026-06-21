import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadViewports } from "../config";

const writeConfig = async (contents: string): Promise<string> => {
  const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));
  await writeFile(path.join(dir, "ovr.config.mjs"), contents);
  return dir;
};

describe("loadViewports", () => {
  it("returns a single default viewport when no config file exists", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      expect(await loadViewports(dir)).toEqual([{ browser: "chromium", viewportWidth: 1280 }]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("treats every viewport as default when 'defaultViewports' is omitted", async () => {
    const dir = await writeConfig(`
      export default {
        viewports: [
          { name: "desktop", width: 1280 },
          { name: "mobile", width: 375 },
        ],
      };
    `);

    try {
      expect(await loadViewports(dir)).toEqual([
        { name: "desktop", browser: "chromium", viewportWidth: 1280 },
        { name: "mobile", browser: "chromium", viewportWidth: 375 },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("only marks viewports named in 'defaultViewports' as default", async () => {
    const dir = await writeConfig(`
      export default {
        viewports: [
          { name: "desktop", width: 1280 },
          { name: "mobile", width: 375 },
          { name: "tablet", width: 768 },
        ],
        defaultViewports: ["desktop"],
      };
    `);

    try {
      expect(await loadViewports(dir)).toEqual([
        { name: "desktop", browser: "chromium", viewportWidth: 1280, default: true },
        { name: "mobile", browser: "chromium", viewportWidth: 375, default: false },
        { name: "tablet", browser: "chromium", viewportWidth: 768, default: false },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when 'defaultViewports' references an unknown viewport name", async () => {
    const dir = await writeConfig(`
      export default {
        viewports: [{ name: "desktop", width: 1280 }],
        defaultViewports: ["nonexistent"],
      };
    `);

    try {
      await expect(loadViewports(dir)).rejects.toThrow(/unknown viewport/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("loads the config from an explicit path relative to cwd", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      await writeFile(
        path.join(dir, "custom.config.mjs"),
        `export default { viewports: [{ name: "desktop", width: 1280 }] };`,
      );

      expect(await loadViewports(dir, "custom.config.mjs")).toEqual([
        { name: "desktop", browser: "chromium", viewportWidth: 1280 },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("loads the config from an explicit absolute path", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      const configPath = path.join(dir, "custom.config.mjs");
      await writeFile(
        configPath,
        `export default { viewports: [{ name: "desktop", width: 1280 }] };`,
      );

      expect(await loadViewports(dir, configPath)).toEqual([
        { name: "desktop", browser: "chromium", viewportWidth: 1280 },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when an explicit config path does not exist", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));

    try {
      await expect(loadViewports(dir, "missing.config.mjs")).rejects.toThrow(/not found/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
