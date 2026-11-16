import { describe, expect, it } from "vitest";

import { buildPullRequestUrl } from "../webPullRequestUrl";

describe("buildPullRequestUrl", () => {
  it("links to the pull request page on github.com for the github provider", () => {
    expect(buildPullRequestUrl("github", "acme/web", 42)).toBe(
      "https://github.com/acme/web/pull/42",
    );
  });
});
