import { describe, expect, it } from "vitest";

import { loadWithPlaywright } from "../loadPlaywright";

const moduleNotFound = (name: string) =>
  Object.assign(new Error(`Cannot find package '${name}' imported from /app/dist/run.js`), {
    code: "ERR_MODULE_NOT_FOUND",
  });

describe("loadWithPlaywright", () => {
  it("should explain how to install Playwright when it is missing", async () => {
    await expect(
      loadWithPlaywright(() => Promise.reject(moduleNotFound("playwright"))),
    ).rejects.toThrow("ovr capture needs Playwright.");
  });

  it("should pass through other errors", async () => {
    const error = moduleNotFound("something-else");

    await expect(loadWithPlaywright(() => Promise.reject(error))).rejects.toBe(error);
  });
});
