import { describe, expect, it, vi } from "vitest";

import { GithubAppConfigError } from "../providers/github/app/config";
import { assertProvidersConfig, getProvider, listProviders } from "../registry";

describe("registry", () => {
  it("looks providers up by id", () => {
    expect(getProvider("github").id).toBe("github");
    expect(listProviders().map(({ id }) => id)).toContain("github");
  });

  it("passes startup checks when no provider has instance settings", () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");
    expect(() => assertProvidersConfig()).not.toThrow();
  });

  it("fails startup checks when a provider's settings are invalid", () => {
    vi.stubEnv("OVR_GITHUB_APP_CLIENT_ID", "Iv23liExample");
    vi.stubEnv("OVR_GITHUB_APP_PRIVATE_KEY", "");
    expect(() => assertProvidersConfig()).toThrow(GithubAppConfigError);
  });
});
