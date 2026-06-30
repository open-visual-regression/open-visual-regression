import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { test as vitest } from "vitest";

export { describe, expect } from "vitest";

type Fixtures = {
  filePath: string;
};

export const test = vitest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  filePath: async ({}, use) => {
    const dir = mkdtempSync(join(tmpdir(), "ovr-logger-"));
    await use(join(dir, "app.log"));
    rmSync(dir, { recursive: true, force: true });
  },
});
