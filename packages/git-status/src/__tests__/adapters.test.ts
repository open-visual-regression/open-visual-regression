import { describe, expect, it, vi } from "vitest";

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

  it("targets the API URL the deployment sets", () => {
    vi.stubEnv("OVR_GITHUB_API_URL", "http://github.internal:4010/");

    const built = resolveAdapter("github").buildRequest(
      { provider: "github", repoIdentifier: "acme/web", token: "t" },
      request,
    );

    expect(built.url).toBe("http://github.internal:4010/repos/acme/web/statuses/abc123");
  });
});
