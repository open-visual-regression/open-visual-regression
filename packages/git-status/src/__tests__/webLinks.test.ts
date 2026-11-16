import { describe, expect, it } from "vitest";

import { buildWebLinks } from "../webLinks";

describe("buildWebLinks", () => {
  it("links to the commit page on github.com for the github provider", () => {
    expect(buildWebLinks("github", "acme/web").commitUrl("abc123")).toBe(
      "https://github.com/acme/web/commit/abc123",
    );
  });

  it("links to the branch page on github.com for the github provider", () => {
    expect(buildWebLinks("github", "acme/web").branchUrl("main")).toBe(
      "https://github.com/acme/web/tree/main",
    );
  });

  it("links to the pull request page on github.com for the github provider", () => {
    expect(buildWebLinks("github", "acme/web").pullRequestUrl(42)).toBe(
      "https://github.com/acme/web/pull/42",
    );
  });
});
