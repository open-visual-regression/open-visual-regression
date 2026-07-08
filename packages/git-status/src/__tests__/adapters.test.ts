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
      baseUrl: null,
      repoIdentifier: "acme/web",
      token: "t",
    };
    const built = resolveAdapter("github").buildRequest(config, request);
    expect(built.url).toBe("https://api.github.com/repos/acme/web/statuses/abc123");
    expect(built.headers.authorization).toBe("Bearer t");
    expect(built.body.state).toBe("failure");
    expect(built.body.target_url).toBe(request.targetUrl);
  });

  it("uses the /api/v1 base for a self-hosted gitea instance", () => {
    const config: AdapterConfig = {
      provider: "gitea",
      baseUrl: "https://gitea.acme.com/",
      repoIdentifier: "acme/web",
      token: "t",
    };
    const built = resolveAdapter("gitea").buildRequest(config, request);
    expect(built.url).toBe("https://gitea.acme.com/api/v1/repos/acme/web/statuses/abc123");
  });

  it("requires a base URL for github enterprise", () => {
    const config: AdapterConfig = {
      provider: "github_enterprise",
      baseUrl: null,
      repoIdentifier: "acme/web",
      token: "t",
    };
    expect(() => resolveAdapter("github_enterprise").buildRequest(config, request)).toThrow(
      /base URL/,
    );
  });
});

describe("gitlab adapter", () => {
  it("url-encodes the project path and maps failure to failed", () => {
    const config: AdapterConfig = {
      provider: "gitlab",
      baseUrl: null,
      repoIdentifier: "group/sub/web",
      token: "t",
    };
    const built = resolveAdapter("gitlab").buildRequest(config, request);
    expect(built.url).toBe("https://gitlab.com/api/v4/projects/group%2Fsub%2Fweb/statuses/abc123");
    expect(built.headers["private-token"]).toBe("t");
    expect(built.body.state).toBe("failed");
    expect(built.body.name).toBe("ovr/visual-review");
  });
});
