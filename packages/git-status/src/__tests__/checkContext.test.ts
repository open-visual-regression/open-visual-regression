import { describe, expect, it } from "vitest";

import { formatCheckContext } from "../checkContext";

describe("formatCheckContext", () => {
  it("prefixes the project name with the product name", () => {
    expect(formatCheckContext("web")).toBe("Open Visual Regression / web");
  });

  it("produces distinct contexts for distinct project names", () => {
    expect(formatCheckContext("web")).not.toBe(formatCheckContext("storybook"));
  });
});
