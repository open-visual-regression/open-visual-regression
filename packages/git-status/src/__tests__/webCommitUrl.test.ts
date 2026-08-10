import { describe, expect, it } from "vitest";

import { buildCommitUrl } from "../webCommitUrl";

describe("buildCommitUrl", () => {
  it("links to the commit page on github.com for the github provider", () => {
    expect(buildCommitUrl("github", "acme/web", "abc123")).toBe(
      "https://github.com/acme/web/commit/abc123",
    );
  });
});
