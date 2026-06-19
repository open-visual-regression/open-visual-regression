import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadViewports } from "../config";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "ovr-cli-config-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const writeConfig = (contents: string) => writeFile(path.join(dir, "ovr.config.mjs"), contents);

describe("loadViewports", () => {
  it("returns a single default viewport when no config file exists", async () => {
    expect(await loadViewports(dir)).toEqual([{ browser: "chromium", viewportWidth: 1280 }]);
  });

  it("treats every viewport as default when 'defaultViewports' is omitted", async () => {
    await writeConfig(`
      export default {
        viewports: [
          { name: "desktop", width: 1280 },
          { name: "mobile", width: 375 },
        ],
      };
    `);

    expect(await loadViewports(dir)).toEqual([
      { name: "desktop", browser: "chromium", viewportWidth: 1280 },
      { name: "mobile", browser: "chromium", viewportWidth: 375 },
    ]);
  });

  it("only marks viewports named in 'defaultViewports' as default", async () => {
    await writeConfig(`
      export default {
        viewports: [
          { name: "desktop", width: 1280 },
          { name: "mobile", width: 375 },
          { name: "tablet", width: 768 },
        ],
        defaultViewports: ["desktop"],
      };
    `);

    expect(await loadViewports(dir)).toEqual([
      { name: "desktop", browser: "chromium", viewportWidth: 1280, default: true },
      { name: "mobile", browser: "chromium", viewportWidth: 375, default: false },
      { name: "tablet", browser: "chromium", viewportWidth: 768, default: false },
    ]);
  });

  it("throws when 'defaultViewports' references an unknown viewport name", async () => {
    await writeConfig(`
      export default {
        viewports: [{ name: "desktop", width: 1280 }],
        defaultViewports: ["nonexistent"],
      };
    `);

    await expect(loadViewports(dir)).rejects.toThrow(/unknown viewport/i);
  });
});
