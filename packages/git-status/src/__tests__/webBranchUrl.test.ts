import { describe, expect, it } from "vitest";

import { buildBranchUrl } from "../webBranchUrl";

describe("buildBranchUrl", () => {
  it("links to the branch page on github.com for the github provider", () => {
    expect(buildBranchUrl("github", "acme/web", "main")).toBe(
      "https://github.com/acme/web/tree/main",
    );
  });
});
