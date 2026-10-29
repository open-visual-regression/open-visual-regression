import { describe, expect, it } from "vitest";

import type { PublishRequest } from "../../publisher";
import { getProvider } from "../../registry";

const request: PublishRequest = {
  sha: "abc123",
  state: "failure",
  context: "ovr/visual-review",
  description: "visual changes need review",
  targetUrl: "https://ovr.example.com/projects/p/builds/b",
};

const github = getProvider("github");

describe("github provider", () => {
  it("posts commit statuses to api.github.com", () => {
    const built = github.statuses.buildRequest("acme/web", "t", request);
    expect(built.url).toBe("https://api.github.com/repos/acme/web/statuses/abc123");
    expect(built.headers.authorization).toBe("Bearer t");
    expect(built.body).toEqual({
      state: "failure",
      context: "ovr/visual-review",
      description: "visual changes need review",
      target_url: request.targetUrl,
    });
  });

  it("verifies against the repository", () => {
    expect(github.statuses.buildVerifyRequest("acme/web", "t").url).toBe(
      "https://api.github.com/repos/acme/web",
    );
  });

  it("links to commits and branches on github.com", () => {
    expect(github.repository.commitUrl("acme/web", "abc123")).toBe(
      "https://github.com/acme/web/commit/abc123",
    );
    expect(github.repository.branchUrl("acme/web", "main")).toBe(
      "https://github.com/acme/web/tree/main",
    );
  });
});
