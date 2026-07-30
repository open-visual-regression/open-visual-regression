import { describe, expect, it } from "vitest";

import { resolveAdapter } from "../adapters";
import type { AdapterConfig, PublishRequest } from "../publisher";

const request: PublishRequest = {
  sha: "abc123",
  state: "failure",
  context: "ovr/visual-review",
  description: "visual changes need review",
  targetUrl: "https://ovr.example.com/projects/p/builds/b",
};

describe("github-family adapter", () => {
  it("targets api.github.com for github", () => {
    const config: AdapterConfig = {
      provider: "github",
      repoIdentifier: "acme/web",
      token: "t",
    };
    const built = resolveAdapter("github").buildRequest(config, request);
    expect(built.url).toBe("https://api.github.com/repos/acme/web/statuses/abc123");
    expect(built.headers.authorization).toBe("Bearer t");
    expect(built.body.state).toBe("failure");
    expect(built.body.target_url).toBe(request.targetUrl);
  });
});
